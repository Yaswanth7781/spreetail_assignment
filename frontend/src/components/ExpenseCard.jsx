import { Link } from 'react-router-dom';
import { formatINR, formatDate } from '../utils/formatCurrency';
import { useAuth } from '../context/AuthContext';

export default function ExpenseCard({ expense, groupId }) {
  const { user } = useAuth();
  const myShare = expense.splits?.find((s) => s.user.id === user?.id);
  const iPaid = expense.paid_by?.id === user?.id;

  return (
    <Link
      to={`/groups/${groupId}/expenses/${expense.id}`}
      className="card p-4 flex items-start justify-between hover:border-brand-400 transition-colors cursor-pointer block"
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-base flex-shrink-0 mt-0.5">
          💳
        </div>
        <div className="min-w-0">
          <p className="font-medium text-slate-800 truncate">{expense.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Paid by <span className="font-medium">{iPaid ? 'you' : expense.paid_by?.name}</span>
            {' · '}
            {formatDate(expense.date)}
          </p>
          {expense.notes && (
            <p className="text-xs text-slate-400 mt-1 truncate">{expense.notes}</p>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="font-semibold text-slate-800">{formatINR(expense.amount)}</p>
        {myShare && (
          <p className={`text-xs mt-0.5 font-medium ${iPaid ? 'text-brand-600' : 'text-red-500'}`}>
            {iPaid ? 'you lent' : 'you owe'} {formatINR(myShare.owed_amount)}
          </p>
        )}
        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium
          ${expense.split_type === 'equal' ? 'bg-blue-50 text-blue-600' :
            expense.split_type === 'percentage' ? 'bg-purple-50 text-purple-600' :
            expense.split_type === 'share' ? 'bg-amber-50 text-amber-600' :
            'bg-slate-100 text-slate-500'}`}>
          {expense.split_type}
        </span>
      </div>
    </Link>
  );
}
