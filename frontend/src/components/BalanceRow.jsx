import { formatINR } from '../utils/formatCurrency';

export default function BalanceRow({ balance, currentUserId, onSettle }) {
  const isYouOwe = balance.from_user.id === currentUserId;
  const isOwedToYou = balance.to_user.id === currentUserId;

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
            {balance.from_user.name.charAt(0)}
          </div>
          <span className={`text-sm font-medium ${isYouOwe ? 'text-red-600' : 'text-slate-700'}`}>
            {isYouOwe ? 'You' : balance.from_user.name}
          </span>
        </div>
        <span className="text-slate-400 text-sm">→</span>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
            {balance.to_user.name.charAt(0)}
          </div>
          <span className={`text-sm font-medium ${isOwedToYou ? 'text-brand-600' : 'text-slate-700'}`}>
            {isOwedToYou ? 'You' : balance.to_user.name}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-semibold text-sm ${isYouOwe ? 'text-red-600' : isOwedToYou ? 'text-brand-600' : 'text-slate-700'}`}>
          {formatINR(balance.amount)}
        </span>
        {(isYouOwe || isOwedToYou) && onSettle && (
          <button
            onClick={() => onSettle(balance)}
            className="text-xs text-brand-600 border border-brand-200 px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors font-medium"
          >
            Settle
          </button>
        )}
      </div>
    </div>
  );
}
