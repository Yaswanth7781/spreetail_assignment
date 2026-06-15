from decimal import Decimal
from datetime import date
from django.test import TestCase
from django.utils import timezone
from users.models import User
from groups.models import Group, GroupMember, MembershipHistory
from expenses.models import Expense, ExpenseSplit, ImportJob, ImportIssue
from settlements.models import Settlement
from expenses.split_logic import compute_splits
from expenses.importer import CSVExpenseImporter, get_fuzzy_name_match, clean_amount_str, parse_date
from balances.calculator import compute_simplified_balances, compute_net_balances

class TestImportParser(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(name='Aisha', email='aisha@example.com', password='password123')
        self.user2 = User.objects.create_user(name='Rohan', email='rohan@example.com', password='password123')
        self.group = Group.objects.create(name='Flatmates', created_by=self.user)
        self.gm1 = GroupMember.objects.create(group=self.group, user=self.user)
        self.gm2 = GroupMember.objects.create(group=self.group, user=self.user2)
        MembershipHistory.objects.create(member=self.gm1, joined_date=date(2026, 2, 1))
        MembershipHistory.objects.create(member=self.gm2, joined_date=date(2026, 2, 1))

    def test_parse_date(self):
        self.assertEqual(parse_date('2026-02-14'), date(2026, 2, 14))
        self.assertEqual(parse_date('14/02/2026'), date(2026, 2, 14))
        self.assertEqual(parse_date('02/14/2026'), date(2026, 2, 14))
        self.assertIsNone(parse_date('invalid-date'))

    def test_clean_amount_str(self):
        curr, amt = clean_amount_str('₹1,500.50')
        self.assertEqual(curr, 'INR')
        self.assertEqual(amt, '1500.50')

        curr_usd, amt_usd = clean_amount_str('$100.00 USD')
        self.assertEqual(curr_usd, 'USD')
        self.assertEqual(amt_usd, '100.00')

    def test_fuzzy_name_match(self):
        group_members = {
            'aisha': self.user,
            'rohan': self.user2
        }
        # Exact match
        user, is_exact, m_type = get_fuzzy_name_match('Aisha', group_members)
        self.assertEqual(user, self.user)
        self.assertTrue(is_exact)

        # Spelling error match
        user_sp, is_exact_sp, m_type_sp = get_fuzzy_name_match('Rohn', group_members)
        self.assertEqual(user_sp, self.user2)
        self.assertFalse(is_exact_sp)
        self.assertEqual(m_type_sp, 'fuzzy_spelling')

        # Substring match
        user_sub, is_exact_sub, m_type_sub = get_fuzzy_name_match('aish', group_members)
        self.assertEqual(user_sub, self.user)
        self.assertFalse(is_exact_sub)
        self.assertEqual(m_type_sub, 'fuzzy_substring')

    def test_dry_run_anomalies(self):
        importer = CSVExpenseImporter(self.group, self.user)
        csv_rows = [
            'Date,Description,Amount,Paid By,Aisha,Rohan',
            '2026-03-01,Dinner,₹1000,Aisha,500,500',
            '2026-03-01,Dinner,1000,Aisha,500,500', # Duplicate 95%
            '2026-03-01,Repayment,₹500,Rohan,,',       # Settlement logged as expense
            '2026-03-02,Snacks,$10 USD,Aisha,5,5',     # USD conversion needed
            '2026-03-03,Negative Split,-100,Aisha,,', # Negative amount
            ',Missing desc,100,Rohan,,'                  # Missing critical date
        ]
        job = importer.dry_run_parse(csv_rows)
        self.assertEqual(job.status, 'pending_review')
        
        issues = list(job.issues.all())
        issue_types = [iss.issue_type for iss in issues]
        
        self.assertIn('duplicate', issue_types)
        self.assertIn('settlement_logged_as_expense', issue_types)
        self.assertIn('currency_conversion', issue_types)
        self.assertIn('negative_amount', issue_types)
        self.assertIn('missing_data', issue_types)

class TestDebtSimplifier(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(name='Aisha', email='aisha@example.com', password='password123')
        self.user_b = User.objects.create_user(name='Rohan', email='rohan@example.com', password='password123')
        self.user_c = User.objects.create_user(name='Priya', email='priya@example.com', password='password123')
        self.group = Group.objects.create(name='Flatmates', created_by=self.user_a)
        
        gm_a = GroupMember.objects.create(group=self.group, user=self.user_a)
        gm_b = GroupMember.objects.create(group=self.group, user=self.user_b)
        gm_c = GroupMember.objects.create(group=self.group, user=self.user_c)
        
        MembershipHistory.objects.create(member=gm_a, joined_date=date(2026, 2, 1))
        MembershipHistory.objects.create(member=gm_b, joined_date=date(2026, 2, 1))
        MembershipHistory.objects.create(member=gm_c, joined_date=date(2026, 2, 1))

    def test_greedy_simplification(self):
        # A pays for B's share: B owes A ₹100
        exp1 = Expense.objects.create(
            group=self.group, title='Expense 1', amount=Decimal('200.00'),
            paid_by=self.user_a, split_type='equal', date=date(2026, 3, 1),
            created_by=self.user_a
        )
        ExpenseSplit.objects.create(expense=exp1, user=self.user_a, owed_amount=Decimal('100.00'))
        ExpenseSplit.objects.create(expense=exp1, user=self.user_b, owed_amount=Decimal('100.00'))

        # B pays for C's share: C owes B ₹100
        exp2 = Expense.objects.create(
            group=self.group, title='Expense 2', amount=Decimal('200.00'),
            paid_by=self.user_b, split_type='equal', date=date(2026, 3, 1),
            created_by=self.user_a
        )
        ExpenseSplit.objects.create(expense=exp2, user=self.user_b, owed_amount=Decimal('100.00'))
        ExpenseSplit.objects.create(expense=exp2, user=self.user_c, owed_amount=Decimal('100.00'))

        # Direct Net Balances should show:
        # B owes A 100
        # C owes B 100
        direct = compute_net_balances(self.group)
        self.assertEqual(len(direct), 2)

        # Simplified Balance: A owes C → A receives 100, C pays 100.
        # Direct path C owes B and B owes A simplifies to: C owes A ₹100. (Rohan is bypass settled)
        simplified = compute_simplified_balances(self.group)
        self.assertEqual(len(simplified), 1)
        self.assertEqual(simplified[0]['from_user'], self.user_c)
        self.assertEqual(simplified[0]['to_user'], self.user_a)
        self.assertEqual(simplified[0]['amount'], Decimal('100.00'))


class TestMembershipHistory(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(name='Aisha', email='aisha@example.com', password='password123')
        self.user_b = User.objects.create_user(name='Rohan', email='rohan@example.com', password='password123')
        self.user_c = User.objects.create_user(name='Meera', email='meera@example.com', password='password123')
        self.group = Group.objects.create(name='Flatmates', created_by=self.user_a)
        
        self.gm_a = GroupMember.objects.create(group=self.group, user=self.user_a)
        self.gm_b = GroupMember.objects.create(group=self.group, user=self.user_b)
        self.gm_c = GroupMember.objects.create(group=self.group, user=self.user_c)
        
        MembershipHistory.objects.create(member=self.gm_a, joined_date=date(2026, 2, 1))
        MembershipHistory.objects.create(member=self.gm_b, joined_date=date(2026, 2, 1))
        
        # Meera left at end of March
        MembershipHistory.objects.create(member=self.gm_c, joined_date=date(2026, 2, 1), left_date=date(2026, 3, 31))

    def test_exclude_inactive_members(self):
        # CSV import handles splits based on who is active on that date.
        # Let's test a CSV row committed on 2026-04-10 (after Meera left).
        importer = CSVExpenseImporter(self.group, self.user_a)
        csv_rows = [
            'Date,Description,Amount,Paid By,Aisha,Rohan,Meera',
            '2026-04-10,April Rent,₹3000,Aisha,1,1,1'
        ]
        
        job = importer.dry_run_parse(csv_rows)
        resolutions = {}
        for issue in job.issues.all():
            resolutions[str(issue.id)] = {
                'resolution_selected': issue.resolution_selected,
                'resolution_details': issue.resolution_details
            }
        
        # Commit the import. Meera should be excluded because the date is 2026-04-10
        # and she left on 2026-03-31.
        imported_count = importer.commit_import(job.id, resolutions)
        self.assertEqual(imported_count, 1)

        expense = Expense.objects.filter(group=self.group, title='April Rent').first()
        self.assertIsNotNone(expense)
        
        # The split should only contain Aisha and Rohan (split equally to ₹1500 each)
        splits = list(expense.splits.all())
        self.assertEqual(len(splits), 2)
        
        split_users = [s.user for s in splits]
        self.assertIn(self.user_a, split_users)
        self.assertIn(self.user_b, split_users)
        self.assertNotIn(self.user_c, split_users)
        
        # Amount verify
        for s in splits:
            self.assertEqual(s.owed_amount, Decimal('1500.00'))


class TestCustomColumnsImporter(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(name='Aisha', email='aisha@example.com', password='password123')
        self.user_b = User.objects.create_user(name='Rohan', email='rohan@example.com', password='password123')
        self.user_c = User.objects.create_user(name='Priya', email='priya@example.com', password='password123')
        self.group = Group.objects.create(name='Flatmates', created_by=self.user_a)
        
        gm_a = GroupMember.objects.create(group=self.group, user=self.user_a)
        gm_b = GroupMember.objects.create(group=self.group, user=self.user_b)
        gm_c = GroupMember.objects.create(group=self.group, user=self.user_c)
        
        MembershipHistory.objects.create(member=gm_a, joined_date=date(2026, 2, 1))
        MembershipHistory.objects.create(member=gm_b, joined_date=date(2026, 2, 1))
        MembershipHistory.objects.create(member=gm_c, joined_date=date(2026, 2, 1))

    def test_parse_splits_from_row_equal(self):
        from expenses.importer import parse_splits_from_row
        splits = parse_splits_from_row('Aisha;Rohan;Priya', '', 'equal')
        self.assertEqual(splits['aisha'], Decimal('1'))
        self.assertEqual(splits['rohan'], Decimal('1'))
        self.assertEqual(splits['priya'], Decimal('1'))

    def test_parse_splits_from_row_percentage(self):
        from expenses.importer import parse_splits_from_row
        splits = parse_splits_from_row('Aisha;Rohan;Priya', 'Aisha 30%; Rohan 30%; Priya 40%', 'percentage')
        self.assertEqual(splits['aisha'], Decimal('30'))
        self.assertEqual(splits['rohan'], Decimal('30'))
        self.assertEqual(splits['priya'], Decimal('40'))

    def test_parse_splits_from_row_share(self):
        from expenses.importer import parse_splits_from_row
        splits = parse_splits_from_row('Aisha;Rohan;Priya', 'Aisha 2; Rohan 1; Priya 1', 'share')
        self.assertEqual(splits['aisha'], Decimal('2'))
        self.assertEqual(splits['rohan'], Decimal('1'))
        self.assertEqual(splits['priya'], Decimal('1'))

    def test_custom_columns_dry_run(self):
        importer = CSVExpenseImporter(self.group, self.user_a)
        csv_rows = [
            'date,description,paid_by,amount,currency,split_type,split_with,split_details,notes',
            '18-03-2026,Electricity Mar,Aisha,1450,INR,equal,Aisha;Rohan;Priya,,',
            '09-03-2026,Goa villa,Dev,540,USD,equal,Aisha;Rohan;Priya,,booked on intl site',
            '10-03-2026,Scooter rent,Priya,3600,INR,share,Aisha;Rohan;Priya,Aisha 1; Rohan 2; Priya 1,Rohan and Dev took the bigger ones'
        ]
        
        job = importer.dry_run_parse(csv_rows)
        self.assertEqual(job.status, 'pending_review')
        
        issues = list(job.issues.all())
        issue_types = [iss.issue_type for iss in issues]
        
        # 'Dev' is unregistered, should trigger fuzzy_name/missing_data for payer
        self.assertTrue(any(iss.issue_type == 'missing_data' and 'payer' in iss.description.lower() for iss in issues))
        # USD row should trigger currency conversion
        self.assertIn('currency_conversion', issue_types)

    def test_custom_columns_commit(self):
        importer = CSVExpenseImporter(self.group, self.user_a)
        csv_rows = [
            'date,description,paid_by,amount,currency,split_type,split_with,split_details,notes',
            '18-03-2026,Electricity Mar,Aisha,1500,INR,equal,Aisha;Rohan;Priya,,',
            '10-03-2026,Scooter rent,Priya,3600,INR,share,Aisha;Rohan;Priya,Aisha 1; Rohan 2; Priya 1,',
            '25-03-2026,Weekend brunch,Meera,2200,INR,percentage,Aisha;Rohan;Priya,Aisha 30%; Rohan 30%; Priya 40%,'
        ]
        
        # We need to map Meera to Priya or Rohan or Aisha? Wait, Meera is not in setup members. Ah! Meera is registered globally in systems, let's create her
        # Wait, the payer for row 4 is Meera, but she is not in group members. In our setup, group members are Aisha, Rohan, Priya. 
        # Meera is not a group member, but let's register her globally first.
        global_meera = User.objects.create_user(name='Meera', email='meera@example.com', password='password123')
        
        job = importer.dry_run_parse(csv_rows)
        resolutions = {}
        for issue in job.issues.all():
            if issue.issue_type == 'fuzzy_name' and 'meera' in issue.description.lower():
                # Resolve adding Meera to group
                resolutions[str(issue.id)] = {
                    'resolution_selected': 'add_to_group',
                    'resolution_details': issue.resolution_details
                }
            else:
                resolutions[str(issue.id)] = {
                    'resolution_selected': issue.resolution_selected,
                    'resolution_details': issue.resolution_details
                }
                
        imported_count = importer.commit_import(job.id, resolutions)
        self.assertEqual(imported_count, 3)
        
        # 1. Verify equal split: 1500 equally split among Aisha, Rohan, Priya (500 each)
        exp1 = Expense.objects.filter(title='Electricity Mar').first()
        self.assertEqual(exp1.amount, Decimal('1500.00'))
        self.assertEqual(exp1.splits.count(), 3)
        for s in exp1.splits.all():
            self.assertEqual(s.owed_amount, Decimal('500.00'))
            
        # 2. Verify share split: 3600 split with shares: Aisha 1, Rohan 2, Priya 1 (total shares = 4).
        # Aisha owes: 3600 * 1/4 = 900
        # Rohan owes: 3600 * 2/4 = 1800
        # Priya owes: 3600 * 1/4 = 900
        exp2 = Expense.objects.filter(title='Scooter rent').first()
        self.assertEqual(exp2.amount, Decimal('3600.00'))
        self.assertEqual(exp2.splits.count(), 3)
        self.assertEqual(exp2.splits.filter(user=self.user_a).first().owed_amount, Decimal('900.00'))
        self.assertEqual(exp2.splits.filter(user=self.user_b).first().owed_amount, Decimal('1800.00'))
        self.assertEqual(exp2.splits.filter(user=self.user_c).first().owed_amount, Decimal('900.00'))

        # 3. Verify percentage split: 2200 split with percentages: Aisha 30%, Rohan 30%, Priya 40% (total = 100%).
        # Aisha owes: 2200 * 30% = 660
        # Rohan owes: 2200 * 30% = 660
        # Priya owes: 2200 * 40% = 880
        exp3 = Expense.objects.filter(title='Weekend brunch').first()
        self.assertEqual(exp3.amount, Decimal('2200.00'))
        self.assertEqual(exp3.splits.count(), 3)
        self.assertEqual(exp3.splits.filter(user=self.user_a).first().owed_amount, Decimal('660.00'))
        self.assertEqual(exp3.splits.filter(user=self.user_b).first().owed_amount, Decimal('660.00'))
        self.assertEqual(exp3.splits.filter(user=self.user_c).first().owed_amount, Decimal('880.00'))

