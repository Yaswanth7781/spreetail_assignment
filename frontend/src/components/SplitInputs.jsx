export function SplitTypeSelector({ value, onChange }) {
  const types = [
    { key: 'equal', label: 'Equal', icon: '⚖️' },
    { key: 'unequal', label: 'Exact', icon: '✏️' },
    { key: 'percentage', label: 'Percent', icon: '%' },
    { key: 'share', label: 'Shares', icon: '🔢' },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {types.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all
            ${value === t.key
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
        >
          <span>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function SplitInputTable({ members, splitType, splits, onChange }) {
  const getLabel = () => {
    if (splitType === 'percentage') return '% share';
    if (splitType === 'share') return 'shares (integer)';
    if (splitType === 'unequal') return 'amount (₹)';
    return '';
  };

  if (splitType === 'equal') {
    return (
      <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
        Split equally among {members.length} member{members.length !== 1 ? 's' : ''}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{getLabel()}</p>
      {members.map((member) => {
        const split = splits.find((s) => s.user_id === member.user.id) || {};
        return (
          <div key={member.user.id} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
              {member.user.name.charAt(0)}
            </div>
            <span className="flex-1 text-sm text-slate-700">{member.user.name}</span>
            <input
              type="number"
              min="0"
              step={splitType === 'share' ? '1' : '0.01'}
              value={split.share_value || ''}
              onChange={(e) =>
                onChange(member.user.id, e.target.value === '' ? '' : parseFloat(e.target.value))
              }
              placeholder={splitType === 'percentage' ? '0' : splitType === 'share' ? '1' : '0.00'}
              className="input w-28 text-right"
            />
          </div>
        );
      })}
    </div>
  );
}
