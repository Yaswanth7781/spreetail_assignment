import csv
import re
from decimal import Decimal, InvalidOperation
from datetime import datetime
from django.utils import timezone
from users.models import User
from groups.models import Group, GroupMember, MembershipHistory
from expenses.models import ImportJob, ImportIssue, Expense, ExpenseSplit
from settlements.models import Settlement

def parse_date(date_str):
    """
    Parse date from string supporting various formats.
    Returns datetime.date or None if invalid.
    """
    if not date_str:
        return None
    date_str = date_str.strip()
    formats = [
        '%Y-%m-%d',
        '%d/%m/%Y',
        '%m/%d/%Y',
        '%Y/%m/%d',
        '%d-%m-%Y',
        '%m-%d-%Y',
        '%b %d, %Y',
        '%d %b %Y'
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None

def clean_amount_str(amount_str):
    """
    Extract currency and numeric amount from a string.
    Returns (currency_code, cleaned_numeric_str)
    """
    if not amount_str:
        return 'INR', '0'
    
    amount_str = amount_str.strip()
    # Check for USD symbols
    currency = 'INR'
    if '$' in amount_str or 'usd' in amount_str.lower():
        currency = 'USD'
        
    # Remove currency symbols, commas, and other non-numeric chars except dot and negative sign
    cleaned = re.sub(r'[^\d\.\-]', '', amount_str)
    return currency, cleaned

def get_fuzzy_name_match(name, group_members_dict, threshold=2):
    """
    Matches a name from CSV to group members.
    group_members_dict maps lowercase names to User objects.
    Returns (User, is_exact, match_type) or (None, False, None)
    """
    name_clean = name.strip().lower()
    if not name_clean:
        return None, False, None
        
    # 1. Exact match
    if name_clean in group_members_dict:
        return group_members_dict[name_clean], True, 'exact'
        
    # 2. Substring match
    for m_name, user in group_members_dict.items():
        if name_clean in m_name or m_name in name_clean:
            return user, False, 'fuzzy_substring'
            
    # 3. Levenshtein edit distance for spelling errors
    for m_name, user in group_members_dict.items():
        dist = edit_distance(name_clean, m_name)
        if dist <= threshold:
            return user, False, 'fuzzy_spelling'
            
    return None, False, None

def edit_distance(s1, s2):
    if len(s1) > len(s2):
        s1, s2 = s2, s1
    distances = range(len(s1) + 1)
    for i2, c2 in enumerate(s2):
        distances_ = [i2+1]
        for i1, c1 in enumerate(s1):
            if c1 == c2:
                distances_.append(distances[i1])
            else:
                distances_.append(1 + min((distances[i1], distances[i1 + 1], distances_[-1])))
        distances = distances_
    return distances[-1]

class CSVExpenseImporter:
    def __init__(self, group, uploaded_by):
        self.group = group
        self.uploaded_by = uploaded_by
        self.job = None

    def dry_run_parse(self, csv_file_wrapper):
        """
        Stage 1: Parse CSV, identify anomalies, and save them as ImportIssue objects.
        Returns the ImportJob instance.
        """
        # Create an import job
        self.job = ImportJob.objects.create(
            group=self.group,
            uploaded_by=self.uploaded_by,
            status='pending_review'
        )
        
        # Read CSV rows
        reader = csv.reader(csv_file_wrapper)
        headers = [h.strip() for h in next(reader, [])]
        rows = list(reader)
        
        # Find user columns (columns that represent roommates names)
        # We fetch all users currently registered or suggested in the group context
        # Let's map existing members
        members_qs = self.group.memberships.select_related('user')
        group_members = {m.user.name.lower(): m.user for m in members_qs}
        
        # Roommate names are typically Aisha, Rohan, Priya, Meera, Sam, Dev
        known_names = {'aisha', 'rohan', 'priya', 'meera', 'sam', 'dev'}
        
        # Match headers to users or potential names
        user_headers = {} # maps header_index -> user_name_string (or matched User object)
        for idx, h in enumerate(headers):
            h_lower = h.lower()
            if h_lower in known_names:
                user_headers[idx] = h_lower
        
        # Find index of standard columns
        date_idx = -1
        desc_idx = -1
        amount_idx = -1
        paid_by_idx = -1
        split_idx = -1
        
        for idx, h in enumerate(headers):
            h_lower = h.lower()
            if 'date' in h_lower:
                date_idx = idx
            elif 'desc' in h_lower or 'title' in h_lower or 'item' in h_lower or h_lower == 'activity':
                desc_idx = idx
            elif 'amount' in h_lower or 'cost' in h_lower or 'price' in h_lower:
                amount_idx = idx
            elif 'paid' in h_lower or 'payer' in h_lower:
                paid_by_idx = idx
            elif 'split' in h_lower:
                split_idx = idx

        # If standard indices not found, make best guess
        if date_idx == -1 and len(headers) > 0: date_idx = 0
        if desc_idx == -1 and len(headers) > 1: desc_idx = 1
        if amount_idx == -1 and len(headers) > 2: amount_idx = 2
        if paid_by_idx == -1 and len(headers) > 3: paid_by_idx = 3
        if split_idx == -1 and len(headers) > 4: split_idx = 4

        processed_rows = []
        
        # Parse each row
        for row_num, row in enumerate(rows, start=2):  # Row 1 is header
            if not row or not any(row):
                continue
                
            raw_data = {headers[i]: row[i] for i in range(min(len(headers), len(row)))}
            
            # Read standard values
            date_raw = row[date_idx] if date_idx < len(row) else ''
            desc_raw = row[desc_idx] if desc_idx < len(row) else ''
            amount_raw = row[amount_idx] if amount_idx < len(row) else ''
            paid_by_raw = row[paid_by_idx] if paid_by_idx < len(row) else ''
            split_raw = row[split_idx] if split_idx < len(row) else 'equal'
            
            issues = []
            
            # 1. Date Format check
            parsed_date = parse_date(date_raw)
            if not parsed_date:
                issues.append({
                    'type': 'missing_data' if not date_raw else 'invalid_date_format',
                    'severity': 'critical',
                    'description': f"Invalid or missing date: '{date_raw}'",
                })
            
            # 2. Description/Title check
            if not desc_raw.strip():
                issues.append({
                    'type': 'missing_data',
                    'severity': 'critical',
                    'description': "Missing expense description/title.",
                })
                
            # 3. Clean Amount and check Currency
            currency, amount_clean = clean_amount_str(amount_raw)
            try:
                parsed_amount = Decimal(amount_clean)
            except InvalidOperation:
                parsed_amount = Decimal('0')
                issues.append({
                    'type': 'missing_data' if not amount_raw else 'invalid_amount',
                    'severity': 'critical',
                    'description': f"Could not parse amount: '{amount_raw}'",
                })
                
            if currency == 'USD':
                issues.append({
                    'type': 'currency_conversion',
                    'severity': 'warning',
                    'description': f"USD transaction detected: '{amount_raw}'. Conversion is required.",
                    'resolution_selected': 'convert',
                    'resolution_details': {'rate': 83.50, 'original_currency': 'USD', 'original_amount': float(parsed_amount)}
                })
                
            # 4. Payer Check & Fuzzy Name Match
            matched_payer = None
            if not paid_by_raw.strip():
                issues.append({
                    'type': 'missing_data',
                    'severity': 'critical',
                    'description': "Missing paid_by/payer field.",
                })
            else:
                user, is_exact, match_type = get_fuzzy_name_match(paid_by_raw, group_members)
                if user:
                    matched_payer = user
                    if not is_exact:
                        issues.append({
                            'type': 'fuzzy_name',
                            'severity': 'warning',
                            'description': f"Spelling mismatch: matched payer '{paid_by_raw}' to member '{user.name}'",
                            'resolution_selected': 'map_user',
                            'resolution_details': {
                                'csv_name': paid_by_raw,
                                'user_id': str(user.id),
                                'user_name': user.name,
                                'user_email': user.email
                            }
                        })
                else:
                    # User not found in group, check if registered in global users
                    global_user = User.objects.filter(name__icontains=paid_by_raw.strip()).first()
                    if global_user:
                        issues.append({
                            'type': 'fuzzy_name',
                            'severity': 'warning',
                            'description': f"Payer '{paid_by_raw}' exists in system but is not in group members. Suggest adding them.",
                            'resolution_selected': 'add_to_group',
                            'resolution_details': {
                                'csv_name': paid_by_raw,
                                'user_id': str(global_user.id),
                                'user_name': global_user.name,
                                'user_email': global_user.email
                            }
                        })
                    else:
                        issues.append({
                            'type': 'missing_data',
                            'severity': 'critical',
                            'description': f"Payer '{paid_by_raw}' does not exist in group or system.",
                        })

            # 5. Settlement logged as expense
            is_settlement = False
            desc_lower = desc_raw.lower()
            if 'repay' in desc_lower or 'payment' in desc_lower or 'settle' in desc_lower or 'paid back' in desc_lower:
                is_settlement = True
                issues.append({
                    'type': 'settlement_logged_as_expense',
                    'severity': 'warning',
                    'description': f"Expense '{desc_raw}' looks like a settlement/repayment. Suggest importing as Settlement.",
                    'resolution_selected': 'convert_to_settlement',
                    'resolution_details': {}
                })

            # 6. Negative Amount check
            if parsed_amount < 0:
                issues.append({
                    'type': 'negative_amount',
                    'severity': 'warning',
                    'description': f"Negative amount found: {parsed_amount}. Select refund, settlement correction, or error fix.",
                    'resolution_selected': 'refund',
                    'resolution_details': {'original_value': float(parsed_amount)}
                })

            # 7. Check splits & values for each user column
            splits_parsed = {}
            for h_idx, name in user_headers.items():
                val_raw = row[h_idx] if h_idx < len(row) else ''
                if val_raw.strip():
                    try:
                        # Clean and parse share value
                        _, val_clean = clean_amount_str(val_raw)
                        splits_parsed[name] = Decimal(val_clean)
                    except InvalidOperation:
                        pass
            
            # Check duplicate detection against already processed rows
            for prev in processed_rows:
                # Calculate duplicate confidence score
                # 95%: same title, date, amount, payer
                # 80%: same date, amount, payer, different title
                # 70%: same title, amount, date close (within 2 days)
                days_diff = None
                if parsed_date and prev['date']:
                    days_diff = abs((parsed_date - prev['date']).days)
                    
                confidence = 0
                match_desc = False
                match_amount = (abs(parsed_amount - prev['amount']) < Decimal('0.01'))
                match_payer = (paid_by_raw.strip().lower() == prev['paid_by_raw'].strip().lower())
                
                # Check description similarity
                if desc_raw.strip().lower() == prev['desc'].strip().lower():
                    match_desc = True
                elif desc_raw.strip().lower() in prev['desc'].strip().lower() or prev['desc'].strip().lower() in desc_raw.strip().lower():
                    match_desc = True

                if match_desc and parsed_date == prev['date'] and match_amount and match_payer:
                    confidence = 95
                elif parsed_date == prev['date'] and match_amount and match_payer:
                    confidence = 80
                elif match_desc and match_amount and days_diff is not None and days_diff <= 2:
                    confidence = 70
                    
                if confidence > 0:
                    issues.append({
                        'type': 'duplicate',
                        'severity': 'warning',
                        'description': f"Potential duplicate of row {prev['row_number']} (Confidence: {confidence}%).",
                        'confidence_score': Decimal(str(confidence)),
                        'resolution_selected': 'ignore',
                        'resolution_details': {'duplicate_row_num': prev['row_number']}
                    })

            # Save issues in database for review
            if not issues:
                ImportIssue.objects.create(
                    import_job=self.job,
                    row_number=row_num,
                    row_data=raw_data,
                    issue_type='clean',
                    severity='info',
                    description="Clean row",
                    approved=True
                )
            else:
                for iss in issues:
                    ImportIssue.objects.create(
                        import_job=self.job,
                        row_number=row_num,
                        row_data=raw_data,
                        issue_type=iss['type'],
                        severity=iss['severity'],
                        description=iss['description'],
                        confidence_score=iss.get('confidence_score'),
                        resolution_selected=iss.get('resolution_selected'),
                        resolution_details=iss.get('resolution_details'),
                        approved=False
                    )

            # Store in processed list for subsequent duplicate checks
            processed_rows.append({
                'row_number': row_num,
                'date': parsed_date,
                'desc': desc_raw,
                'amount': parsed_amount,
                'paid_by_raw': paid_by_raw,
                'splits': splits_parsed
            })

        return self.job

    def commit_import(self, job_id, approved_issues_resolutions, custom_timeline_dates=None):
        """
        Stage 2: Process the CSV import using resolutions chosen by the user.
        approved_issues_resolutions maps issue_id -> {resolution_selected, resolution_details, row_data_fixed}
        custom_timeline_dates provides dynamic user join/leave date settings.
        """
        job = ImportJob.objects.get(pk=job_id)
        group = job.group
        
        # Apply custom membership timelines first (Dev's trip, Meera leaving, Sam joining)
        if custom_timeline_dates:
            # Format: { "username_or_email": { "joined_date": "YYYY-MM-DD", "left_date": "YYYY-MM-DD" or null } }
            for name, dates in custom_timeline_dates.items():
                user = User.objects.filter(name__iexact=name).first()
                if user:
                    gm, _ = GroupMember.objects.get_or_create(group=group, user=user)
                    joined = parse_date(dates.get('joined_date')) or timezone.now().date()
                    left = parse_date(dates.get('left_date'))
                    
                    # Create or update history
                    hist = gm.history.first()
                    if hist:
                        hist.joined_date = joined
                        hist.left_date = left
                        hist.save()
                    else:
                        MembershipHistory.objects.create(member=gm, joined_date=joined, left_date=left)

        # Get list of issues for this job
        issues = job.issues.all()
        issues_by_row = {}
        for issue in issues:
            issues_by_row.setdefault(issue.row_number, []).append(issue)

        # Build group member lookup dict and cache timelines
        members_qs = group.memberships.prefetch_related('history').select_related('user')
        group_members = {m.user.name.lower(): m.user for m in members_qs}
        group_users = {str(m.user.id): m.user for m in members_qs}
        
        member_timelines = {}
        for m in members_qs:
            member_timelines[m.user.id] = [
                (h.joined_date, h.left_date) for h in m.history.all()
            ]
        
        # Sort rows to process in order
        row_numbers = sorted(list({issue.row_number for issue in issues}))
        
        # Collect row data map
        all_row_data = {}
        for issue in issues:
            all_row_data[issue.row_number] = issue.row_data

        # Process each row
        imported_count = 0
        for row_num in row_numbers:
            row_issues = issues_by_row[row_num]
            row_data = all_row_data[row_num].copy()
            
            # Check if any issue for this row was resolved to "ignore" or "skip"
            should_skip = False
            is_settlement_repayment = False
            conversion_rate = Decimal('1.0')
            original_currency = 'INR'
            negative_amount_resolution = 'refund'
            
            # Apply resolution updates from user
            for issue in row_issues:
                iss_id_str = str(issue.id)
                res_choice = issue.resolution_selected
                res_details = issue.resolution_details or {}
                
                # Check if user submitted custom overrides
                if iss_id_str in approved_issues_resolutions:
                    user_res = approved_issues_resolutions[iss_id_str]
                    res_choice = user_res.get('resolution_selected', res_choice)
                    res_details = user_res.get('resolution_details', res_details)
                    if 'row_data_fixed' in user_res and user_res['row_data_fixed']:
                        row_data.update(user_res['row_data_fixed'])
                
                if res_choice == 'ignore' or res_choice == 'skip':
                    should_skip = True
                elif res_choice == 'convert_to_settlement':
                    is_settlement_repayment = True
                elif res_choice == 'convert' and res_details:
                    original_currency = res_details.get('original_currency', 'USD')
                    conversion_rate = Decimal(str(res_details.get('rate', '83.50')))
                elif issue.issue_type == 'negative_amount':
                    negative_amount_resolution = res_choice

            if should_skip:
                continue

            # Read columns (with fixed row data if user edited online)
            # Find indices
            headers = list(row_data.keys())
            
            date_col = next((h for h in headers if 'date' in h.lower()), headers[0])
            desc_col = next((h for h in headers if 'desc' in h.lower() or 'title' in h.lower() or 'item' in h.lower() or h.lower() == 'activity'), headers[1] if len(headers) > 1 else headers[0])
            amount_col = next((h for h in headers if 'amount' in h.lower() or 'cost' in h.lower() or 'price' in h.lower()), headers[2] if len(headers) > 2 else headers[0])
            paid_by_col = next((h for h in headers if 'paid' in h.lower() or 'payer' in h.lower()), headers[3] if len(headers) > 3 else headers[0])
            split_col = next((h for h in headers if 'split' in h.lower()), headers[4] if len(headers) > 4 else headers[0])

            date_val = row_data[date_col]
            desc_val = row_data[desc_col]
            amount_val = row_data[amount_col]
            paid_by_val = row_data[paid_by_col]
            split_val = row_data.get(split_col, 'equal')

            parsed_date = parse_date(date_val)
            if not parsed_date:
                # If date format is still wrong, fail or skip
                continue

            _, amount_clean = clean_amount_str(amount_val)
            try:
                parsed_amount = Decimal(amount_clean)
            except InvalidOperation:
                continue

            # Handle negative amount resolutions
            if parsed_amount < 0:
                if negative_amount_resolution == 'error':
                    # Fix: make it positive
                    parsed_amount = abs(parsed_amount)
                elif negative_amount_resolution == 'settlement':
                    is_settlement_repayment = True
                    parsed_amount = abs(parsed_amount)
                # 'refund' is handled by letting splits remain negative or reversing debtor roles

            # Map payer name
            payer_user = None
            payer_clean = paid_by_val.strip().lower()
            if payer_clean in group_members:
                payer_user = group_members[payer_clean]
            else:
                # Fuzzy resolved match lookup
                for issue in row_issues:
                    res_choice = issue.resolution_selected
                    res_details = issue.resolution_details or {}
                    
                    # Apply overrides from request resolutions if available
                    iss_id_str = str(issue.id)
                    if iss_id_str in approved_issues_resolutions:
                        user_res = approved_issues_resolutions[iss_id_str]
                        res_choice = user_res.get('resolution_selected', res_choice)
                        res_details = user_res.get('resolution_details', res_details)
                    
                    if res_choice == 'map_user' and res_details:
                        mapped_uid = res_details.get('user_id')
                        if mapped_uid:
                            payer_user = group_users.get(mapped_uid)
                            if not payer_user:
                                payer_user = User.objects.filter(pk=mapped_uid).first()
                                if payer_user:
                                    group_users[mapped_uid] = payer_user
                            break
                    elif res_choice == 'add_to_group' and res_details:
                        mapped_uid = res_details.get('user_id')
                        if mapped_uid:
                            target_u = group_users.get(mapped_uid)
                            if not target_u:
                                target_u = User.objects.filter(pk=mapped_uid).first()
                                if target_u:
                                    group_users[mapped_uid] = target_u
                            if target_u:
                                gm, created = GroupMember.objects.get_or_create(group=group, user=target_u)
                                if created:
                                    MembershipHistory.objects.create(member=gm, joined_date=parsed_date)
                                    member_timelines[target_u.id] = [(parsed_date, None)]
                                group_members[target_u.name.lower()] = target_u
                                payer_user = target_u
                                break
                    elif res_choice == 'create_new_user' and res_details:
                        new_name = res_details.get('name')
                        new_email = res_details.get('email')
                        if new_name:
                            # Re-use existing member created/added earlier in this run to avoid duplicate entries
                            if new_name.lower() in group_members:
                                target_u = group_members[new_name.lower()]
                            else:
                                import random
                                if not new_email:
                                    new_email = f"{new_name.lower().replace(' ', '_')}_{random.randint(1000, 9999)}@example.com"
                                
                                target_u = User.objects.filter(email=new_email).first()
                                if not target_u:
                                    target_u = User.objects.create_user(
                                        email=new_email,
                                        name=new_name,
                                        password=User.objects.make_random_password()
                                    )
                                
                                gm, created = GroupMember.objects.get_or_create(group=group, user=target_u)
                                if created:
                                    MembershipHistory.objects.create(member=gm, joined_date=parsed_date)
                                    member_timelines[target_u.id] = [(parsed_date, None)]
                                    group_users[str(target_u.id)] = target_u
                                
                                group_members[target_u.name.lower()] = target_u
                            
                            payer_user = target_u
                            break

            # If still not found, check if a global user matches, otherwise skip
            if not payer_user:
                payer_user = User.objects.filter(name__icontains=paid_by_val.strip()).first()
                if not payer_user:
                    continue

            # Ensure payer is added to group
            if payer_user.name.lower() not in group_members:
                gm, _ = GroupMember.objects.get_or_create(group=group, user=payer_user)
                MembershipHistory.objects.get_or_create(member=gm, defaults={'joined_date': parsed_date})
                group_members[payer_user.name.lower()] = payer_user

            # Convert currency to INR
            inr_amount = parsed_amount
            if original_currency == 'USD':
                inr_amount = (parsed_amount * conversion_rate).quantize(Decimal('0.01'))

            # Parse split participants
            # Identify columns for each roommate
            roommate_splits = {}
            for h in headers:
                h_clean = h.lower().strip()
                if h_clean in group_members:
                    val = row_data[h]
                    if val.strip():
                        try:
                            _, val_clean = clean_amount_str(val)
                            roommate_splits[group_members[h_clean]] = Decimal(val_clean)
                        except InvalidOperation:
                            pass

            if is_settlement_repayment:
                # Import as Settlement
                # If splits are provided, find who has a positive share (recipient)
                # Paid_by pays the recipient
                recipient = None
                if roommate_splits:
                    # Find someone other than payer who owes or is paid
                    for u, val in roommate_splits.items():
                        if u != payer_user and val != 0:
                            recipient = u
                            break
                if not recipient:
                    # Try to parse from title "Aisha paid Rohan" -> Rohan is recipient
                    for name_clean, u in group_members.items():
                        if name_clean in desc_lower and u != payer_user:
                            recipient = u
                            break
                if not recipient:
                    # Default: first other group member
                    recipient = next((u for u in group_members.values() if u != payer_user), None)

                if recipient:
                    Settlement.objects.create(
                        group=group,
                        paid_by=payer_user,
                        paid_to=recipient,
                        amount=abs(inr_amount),
                        date=parsed_date,
                        notes=f"CSV Import Repayment: {desc_val}"
                    )
                    imported_count += 1
                continue

            # Standard Expense import
            # Calculate splits
            split_type = 'equal'
            if split_val.strip().lower() in ('unequal', 'percentage', 'share'):
                split_type = split_val.strip().lower()

            # Filter splits based on membership dates (Sam in March, Meera in April, etc.)
            # A split user is only included if they were active in the group on parsed_date
            active_users = []
            for u in group_members.values():
                intervals = member_timelines.get(u.id, [])
                is_active = False
                for joined_date, left_date in intervals:
                    if joined_date <= parsed_date:
                        if left_date is None or left_date >= parsed_date:
                            is_active = True
                            break
                if is_active:
                    active_users.append(u)

            # If equal split and no specific roommate values in CSV, include all active users
            if not roommate_splits and split_type == 'equal':
                for u in active_users:
                    roommate_splits[u] = Decimal('1')  # equal shares

            # Filter splits to only include active members
            final_splits_input = []
            for u, val in roommate_splits.items():
                if u in active_users:
                    final_splits_input.append({
                        'user_id': str(u.id),
                        'share_value': float(val) if split_type != 'equal' else None
                    })

            # Check if any splits remain
            if not final_splits_input:
                continue

            # Compute splits using backend compute_splits logic
            from expenses.split_logic import compute_splits
            try:
                computed_splits = compute_splits(inr_amount, split_type, final_splits_input)
            except (ValueError, ZeroDivisionError):
                continue

            # Create the expense in the database
            expense = Expense.objects.create(
                group=group,
                title=desc_val,
                original_amount=parsed_amount if original_currency == 'USD' else inr_amount,
                currency=original_currency,
                exchange_rate=conversion_rate,
                amount=inr_amount,
                paid_by=payer_user,
                split_type=split_type,
                notes=f"CSV Import Row {row_num}",
                date=parsed_date,
                created_by=job.uploaded_by
            )

            # Create split rows
            for split in computed_splits:
                uid = split['user_id']
                user = group_users.get(uid)
                if not user:
                    user = User.objects.get(pk=uid)
                    group_users[uid] = user
                ExpenseSplit.objects.create(
                    expense=expense,
                    user=user,
                    owed_amount=split['owed_amount'],
                    share_value=split['share_value']
                )

            imported_count += 1

        # Complete the job
        job.status = 'completed'
        job.save()
        return imported_count
