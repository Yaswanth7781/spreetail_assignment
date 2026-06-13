from decimal import Decimal, ROUND_HALF_UP


def compute_splits(amount, split_type, splits_input):
    """
    splits_input: list of dicts with 'user_id' and optionally 'share_value'
    Returns: list of dicts with 'user_id', 'owed_amount', 'share_value'
    """
    amount = Decimal(str(amount))
    n = len(splits_input)

    if split_type == 'equal':
        per_person = (amount / n).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        # Adjust last person for rounding
        total_distributed = per_person * (n - 1)
        last_amount = amount - total_distributed
        result = []
        for i, s in enumerate(splits_input):
            result.append({
                'user_id': s['user_id'],
                'owed_amount': last_amount if i == n - 1 else per_person,
                'share_value': None,
            })
        return result

    elif split_type == 'unequal':
        result = []
        for s in splits_input:
            result.append({
                'user_id': s['user_id'],
                'owed_amount': Decimal(str(s['share_value'])).quantize(Decimal('0.01')),
                'share_value': Decimal(str(s['share_value'])),
            })
        return result

    elif split_type == 'percentage':
        result = []
        for i, s in enumerate(splits_input):
            pct = Decimal(str(s['share_value']))
            owed = (amount * pct / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            result.append({
                'user_id': s['user_id'],
                'owed_amount': owed,
                'share_value': pct,
            })
        return result

    elif split_type == 'share':
        total_shares = sum(Decimal(str(s['share_value'])) for s in splits_input)
        result = []
        distributed = Decimal('0')
        for i, s in enumerate(splits_input):
            share = Decimal(str(s['share_value']))
            if i == len(splits_input) - 1:
                owed = amount - distributed
            else:
                owed = (amount * share / total_shares).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                distributed += owed
            result.append({
                'user_id': s['user_id'],
                'owed_amount': owed,
                'share_value': share,
            })
        return result

    raise ValueError(f'Unknown split type: {split_type}')
