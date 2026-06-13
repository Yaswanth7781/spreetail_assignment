from decimal import Decimal
from django.db.models import Sum
from expenses.models import ExpenseSplit, Expense
from settlements.models import Settlement


def compute_group_balances(group):
    """
    Returns list of {from_user, to_user, amount} for all positive pairwise balances in group.
    Only includes pairs where net > 0.
    """
    # Get all members
    members = list(group.memberships.select_related('user').values_list('user', flat=True))

    # Build pairwise balance matrix: balance[a][b] = a owes b
    balance = {}
    for m in members:
        balance[str(m)] = {}
        for n in members:
            balance[str(m)][str(n)] = Decimal('0')

    # Process expenses: for each split, split.user owes expense.paid_by
    expenses = group.expenses.select_related('paid_by').prefetch_related('splits__user')
    for expense in expenses:
        paid_by_id = str(expense.paid_by_id)
        for split in expense.splits.all():
            split_user_id = str(split.user_id)
            if split_user_id == paid_by_id:
                continue  # payer doesn't owe themselves
            if paid_by_id in balance.get(split_user_id, {}):
                balance[split_user_id][paid_by_id] += split.owed_amount

    # Process settlements: paid_by reduces debt to paid_to
    settlements = group.settlements.select_related('paid_by', 'paid_to')
    for s in settlements:
        from_id = str(s.paid_by_id)
        to_id = str(s.paid_to_id)
        if from_id in balance and to_id in balance[from_id]:
            balance[from_id][to_id] -= s.amount
        # If over-settled, add reverse
        # Net it out:
        if to_id in balance and from_id in balance[to_id]:
            balance[to_id][from_id] += s.amount
            balance[from_id][to_id] -= s.amount
            # Re-normalize to avoid double counting
            # Actually re-think: just do net
    # Re-compute cleanly
    return compute_net_balances(group)


def compute_net_balances(group):
    """
    Net pairwise balances: if A owes B 100 from splits, and B paid A 60 in settlement,
    then A owes B 40.
    Returns list of {from_user_id, to_user_id, amount} where amount > 0.
    """
    from users.models import User
    members_qs = group.memberships.select_related('user')
    member_map = {str(m.user.id): m.user for m in members_qs}
    member_ids = list(member_map.keys())

    # net[a][b] = net amount a owes b (after all expenses and settlements)
    net = {a: {b: Decimal('0') for b in member_ids} for a in member_ids}

    # From expenses
    expenses = group.expenses.select_related('paid_by').prefetch_related('splits__user')
    for expense in expenses:
        paid_by_id = str(expense.paid_by_id)
        for split in expense.splits.all():
            user_id = str(split.user_id)
            if user_id == paid_by_id:
                continue
            if user_id in net and paid_by_id in net[user_id]:
                net[user_id][paid_by_id] += split.owed_amount

    # From settlements: A paid B → A's debt to B decreases
    settlements = group.settlements.select_related('paid_by', 'paid_to')
    for s in settlements:
        from_id = str(s.paid_by_id)
        to_id = str(s.paid_to_id)
        if from_id in net and to_id in net[from_id]:
            net[from_id][to_id] -= s.amount

    # Consolidate A→B and B→A into single net direction
    result = []
    visited = set()
    for a in member_ids:
        for b in member_ids:
            if a == b or (a, b) in visited or (b, a) in visited:
                continue
            visited.add((a, b))
            a_owes_b = net[a][b]
            b_owes_a = net[b][a]
            net_amount = a_owes_b - b_owes_a
            if net_amount > Decimal('0.01'):
                result.append({
                    'from_user': member_map[a],
                    'to_user': member_map[b],
                    'amount': net_amount,
                })
            elif net_amount < Decimal('-0.01'):
                result.append({
                    'from_user': member_map[b],
                    'to_user': member_map[a],
                    'amount': abs(net_amount),
                })

    return result


def compute_user_summary(user):
    """
    Across all groups, returns net balance per counterpart user.
    Positive = you are owed, Negative = you owe.
    """
    from groups.models import Group
    groups = Group.objects.filter(memberships__user=user)
    summary = {}

    for group in groups:
        balances = compute_net_balances(group)
        for b in balances:
            from_id = str(b['from_user'].id)
            to_id = str(b['to_user'].id)
            user_id = str(user.id)

            if from_id == user_id:
                # user owes to_user
                key = to_id
                other = b['to_user']
                delta = -b['amount']
            elif to_id == user_id:
                # from_user owes user
                key = from_id
                other = b['from_user']
                delta = b['amount']
            else:
                continue

            if key not in summary:
                summary[key] = {'user': other, 'net': Decimal('0')}
            summary[key]['net'] += delta

    result = []
    for key, val in summary.items():
        if abs(val['net']) > Decimal('0.01'):
            result.append({
                'user': val['user'],
                'net_amount': val['net'],
            })
    return result
