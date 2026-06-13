import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { getGroup } from '../api/groups';
import { createSettlement } from '../api/settlements';
import { useAuth } from '../context/AuthContext';
import { today } from '../utils/formatCurrency';

export default function Settle() {
  const { id: groupId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [form, setForm] = useState({
    paid_by_id: searchParams.get('from') || '',
    paid_to_id: searchParams.get('to') || '',
    amount: searchParams.get('amount') || '',
    notes: '',
    date: today(),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(true);

  useEffect(() => {
    getGroup(groupId)
      .then((res) => {
        setGroup(res.data);
        if (!form.paid_by_id) {
          setForm((f) => ({ ...f, paid_by_id: user?.id || '' }));
        }
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setGroupLoading(false));
  }, [groupId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.paid_by_id === form.paid_to_id) {
      setError('Payer and receiver cannot be the same person.');
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await createSettlement(groupId, {
        paid_by_id: form.paid_by_id,
        paid_to_id: form.paid_to_id,
        amount: parseFloat(form.amount),
        notes: form.notes.trim(),
        date: form.date,
      });
      navigate(`/groups/${groupId}?tab=settlements`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not record settlement.');
    } finally {
      setLoading(false);
    }
  };

  if (groupLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  const members = group?.members || [];

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-5">
        <Link
          to={`/groups/${groupId}`}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          ← Back to {group?.name}
        </Link>
      </div>

      <div className="card p-6">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Record a payment</h1>
        <p className="text-sm text-slate-500 mb-6">
          Record a cash or external payment to mark a debt as settled.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Paid by */}
          <div>
            <label className="label">Who paid?</label>
            <select
              className="input"
              value={form.paid_by_id}
              onChange={(e) => setForm({ ...form, paid_by_id: e.target.value })}
              required
            >
              <option value="">Select payer</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name}{m.user.id === user?.id ? ' (you)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Paid to */}
          <div>
            <label className="label">Paid to</label>
            <select
              className="input"
              value={form.paid_to_id}
              onChange={(e) => setForm({ ...form, paid_to_id: e.target.value })}
              required
            >
              <option value="">Select receiver</option>
              {members
                .filter((m) => m.user.id !== form.paid_by_id)
                .map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name}{m.user.id === user?.id ? ' (you)' : ''}
                  </option>
                ))}
            </select>
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹)</label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Cash payment, UPI transfer"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
              {loading ? 'Recording…' : 'Record payment'}
            </button>
            <Link to={`/groups/${groupId}`} className="btn-secondary flex-1 py-2.5 text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
