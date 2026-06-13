import { Link } from 'react-router-dom';
import { formatINR } from '../utils/formatCurrency';

export default function GroupCard({ group, netAmount }) {
  const isOwed = parseFloat(netAmount) > 0;
  const isOwe = parseFloat(netAmount) < 0;

  return (
    <Link to={`/groups/${group.id}`} className="card p-4 flex items-center justify-between hover:border-brand-500 transition-colors group cursor-pointer block">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
          {group.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-slate-800 group-hover:text-brand-700 transition-colors">{group.name}</p>
          <p className="text-xs text-slate-500">{group.member_count} member{group.member_count !== 1 ? 's' : ''}</p>
        </div>
      </div>
      {netAmount !== undefined && (
        <div className="text-right">
          {isOwed && (
            <span className="text-sm font-semibold text-brand-600">
              +{formatINR(netAmount)}
            </span>
          )}
          {isOwe && (
            <span className="text-sm font-semibold text-red-500">
              {formatINR(netAmount)}
            </span>
          )}
          {!isOwed && !isOwe && (
            <span className="text-sm text-slate-400">settled up</span>
          )}
          <p className="text-xs text-slate-400 mt-0.5">{isOwed ? 'you are owed' : isOwe ? 'you owe' : ''}</p>
        </div>
      )}
    </Link>
  );
}
