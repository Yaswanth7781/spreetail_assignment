import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createGroup } from '../api/groups';

export default function CreateGroup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await createGroup({ name: form.name.trim(), description: form.description.trim() });
      navigate(`/groups/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          ← Back to dashboard
        </Link>
      </div>

      <div className="card p-6">
        <h1 className="text-xl font-bold text-slate-800 mb-6">Create a new group</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Group name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Goa Trip, Flat 3B, Office Lunch"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Description <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="What's this group for?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading || !form.name.trim()} className="btn-primary flex-1 py-2.5">
              {loading ? 'Creating…' : 'Create group'}
            </button>
            <Link to="/dashboard" className="btn-secondary flex-1 py-2.5 text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
