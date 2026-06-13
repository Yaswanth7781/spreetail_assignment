import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getGroup } from '../api/groups';
import { createExpense } from '../api/expenses';
import { SplitTypeSelector, SplitInputTable } from '../components/SplitInputs';
import { useAuth } from '../context/AuthContext';
import { today } from '../utils/formatCurrency';

export default function CreateExpense() {
  const { id: groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    paid_by_id: '',
    split_type: 'equal',
    notes: '',
    date: today(),
  });
  const [splits, setSplits] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(true);

  useEffect(() => {
    getGroup(groupId)
      .then((res) => {
        setGroup(res.data);
        setForm((f) => ({ ...f, paid_by_id: user?.id || '' }));
        // Init splits with all members
        const memberSplits = res.data.members.map((m) => ({
          user_id: m.user.id,
          share_value: '',
        }));
        setSplits(memberSplits);
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setGroupLoading(false));
  }, [groupId]);

  const handleSplitChange = (userId, value) => {
    setSplits((prev) =>
      prev.map((s) => (s.user_id === userId ? { ...s, share_value: value } : s))
    );
  };

  const validateSplits = () => {
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) return 'Enter a valid amount.';

    if (form.split_type === 'equal') return null;

    const values = splits.map((s) => parseFloat(s.share_value));
    if (values.some(isNaN) || values.some((v) => v < 0)) {
      return 'All split values must be valid positive numbers.';
    }

    if (form.split_type === 'percentage') {
      const total = values.reduce((a, b) => a + b, 0);
      if (Math.abs(total - 100) > 0.01) return `Percentages must sum to 100%. Currently: ${total.toFixed(2)}%`;
    }

    if (form.split_type === 'unequal') {
      const total = values.reduce((a, b) => a + b, 0);
      if (Math.abs(total - amount) > 0.01) return `Amounts must sum to ₹${amount}. Currently: ₹${total.toFixed(2)}`;
    }

    if (form.split_type === 'share') {
      if (values.some((v) => !Number.isInteger(v) || v < 1)) return 'Share values must be positive integers.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateSplits();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    const payload = {
      title: form.title.trim(),
      amount: parseFloat(form.amount),
      paid_by_id: form.paid_by_id,
      split_type: form.split_type,
      notes: form.notes.trim(),
      date: form.date,
      splits: form.split_type === 'equal'
        ? group.members.map((m) => ({ user_id: m.user.id, share_value: null }))
        : splits.map((s) => ({ user_id: s.user_id, share_value: parseFloat(s.share_value) })),
    };

    try {
      await createExpense(groupId, payload);
      navigate(`/groups/${groupId}`);
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'object') {
        const msgs = Object.values(data).flat().join(' ');
        setError(msgs || 'Failed to create expense.');
      } else {
        setError('Failed to create expense.');
      }
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

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-5">
        <Link to={`/groups/${groupId}`} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          ← Back to {group?.name}
        </Link>
      </div>

      <div className="card p-6">
        <h1 className="text-xl font-bold text-slate-800 mb-6">Add expense</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="label">Description *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Hotel stay, Groceries, Petrol"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              autoFocus
            />
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹) *</label>
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
              <label className="label">Date *</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Paid by */}
          <div>
            <label className="label">Paid by *</label>
            <select
              className="input"
              value={form.paid_by_id}
              onChange={(e) => setForm({ ...form, paid_by_id: e.target.value })}
              required
            >
              {group?.members?.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name}{m.user.id === user?.id ? ' (you)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Split type */}
          <div>
            <label className="label mb-2">Split type</label>
            <SplitTypeSelector
              value={form.split_type}
              onChange={(t) => setForm({ ...form, split_type: t })}
            />
          </div>

          {/* Split input table */}
          <div>
            <label className="label mb-2">Split details</label>
            <SplitInputTable
              members={group?.members || []}
              splitType={form.split_type}
              splits={splits}
              onChange={handleSplitChange}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Any additional details…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
              {loading ? 'Saving…' : 'Add expense'}
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
