import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getExpense, deleteExpense } from '../api/expenses';
import ChatBox from '../components/ChatBox';
import { formatINR, formatDate } from '../utils/formatCurrency';
import { useAuth } from '../context/AuthContext';

const SPLIT_LABELS = {
  equal: 'Split equally',
  unequal: 'Split by exact amounts',
  percentage: 'Split by percentage',
  share: 'Split by shares',
};

export default function ExpenseDetail() {
  const { id: groupId, eid } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    getExpense(groupId, eid)
      .then((res) => setExpense(res.data))
      .catch(() => navigate(`/groups/${groupId}`))
      .finally(() => setLoading(false));
  }, [groupId, eid]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteExpense(groupId, eid);
      navigate(`/groups/${groupId}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete expense.');
      setDeleting(false);
    }
  };

  const canDelete =
    expense &&
    user &&
    (expense.created_by?.id === user.id);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!expense) return null;

  const myShare = expense.splits?.find((s) => s.user?.id === user?.id);
  const iPaid = expense.paid_by?.id === user?.id;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-5">
        <Link
          to={`/groups/${groupId}`}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          ← Back to group
        </Link>
      </div>

      {/* Expense Header */}
      <div className="card p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{expense.title}</h1>
            {expense.notes && (
              <p className="text-slate-500 text-sm mt-1">{expense.notes}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                📅 {formatDate(expense.date)}
              </span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                💳 Paid by {iPaid ? 'you' : expense.paid_by?.name}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium
                ${expense.split_type === 'equal' ? 'bg-blue-50 text-blue-600' :
                  expense.split_type === 'percentage' ? 'bg-purple-50 text-purple-600' :
                  expense.split_type === 'share' ? 'bg-amber-50 text-amber-600' :
                  'bg-slate-100 text-slate-500'}`}
              >
                {SPLIT_LABELS[expense.split_type]}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-slate-800">{formatINR(expense.amount)}</p>
            {myShare && (
              <p className={`text-sm font-medium mt-1 ${iPaid ? 'text-brand-600' : 'text-red-500'}`}>
                {iPaid ? 'You lent ' : 'You owe '}
                {formatINR(myShare.owed_amount)}
              </p>
            )}
          </div>
        </div>

        {/* Delete */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Added by {expense.created_by?.name} · {formatDate(expense.created_at)}
          </p>
          {canDelete && (
            <div>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Delete expense
                </button>
              ) : (
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-slate-600">Are you sure?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Splits Breakdown */}
      <div className="card p-5 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Split breakdown</h2>
        <div className="space-y-3">
          {expense.splits?.map((split) => {
            const isMe = split.user?.id === user?.id;
            const isPayer = split.user?.id === expense.paid_by?.id;
            return (
              <div key={split.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                    {split.user?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5 flex-wrap">
                      {isMe ? 'You' : split.user?.name}
                      {isPayer ? (
                        <span className="text-xs bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-full font-medium">paid</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100/60 px-1.5 py-0.5 rounded-full font-medium">
                          owes {expense.paid_by?.id === user?.id ? 'you' : expense.paid_by?.name}
                        </span>
                      )}
                    </p>
                    {split.share_value != null && (
                      <p className="text-xs text-slate-400">
                        {expense.split_type === 'percentage'
                          ? `${split.share_value}%`
                          : expense.split_type === 'share'
                          ? `${split.share_value} share${split.share_value !== 1 ? 's' : ''}`
                          : ''}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`text-sm font-semibold ${isMe && !isPaid ? 'text-red-500' : 'text-slate-700'}`}>
                  {formatINR(split.owed_amount)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat */}
      <ChatBox expenseId={eid} />
    </div>
  );
}
