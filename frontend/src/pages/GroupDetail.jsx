import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getGroup, addMember, removeMember, deleteGroup } from '../api/groups';
import { getExpenses } from '../api/expenses';
import { getGroupBalances } from '../api/balances';
import { getSettlements } from '../api/settlements';
import { searchUsers } from '../api/auth';
import ExpenseCard from '../components/ExpenseCard';
import BalanceRow from '../components/BalanceRow';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatDate } from '../utils/formatCurrency';

const TABS = ['Expenses', 'Balances', 'Settlements', 'Members'];

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [tab, setTab] = useState('Expenses');
  const [loading, setLoading] = useState(true);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const isAdmin = group?.created_by?.id === user?.id;

  const loadData = async () => {
    try {
      const [grRes, expRes, balRes, setRes] = await Promise.all([
        getGroup(id),
        getExpenses(id),
        getGroupBalances(id),
        getSettlements(id),
      ]);
      setGroup(grRes.data);
      setExpenses(expRes.data);
      setBalances(balRes.data.balances);
      setSettlements(setRes.data);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    setMemberError('');
    setMemberLoading(true);
    try {
      await addMember(id, memberEmail.trim());
      setMemberEmail('');
      loadData();
    } catch (err) {
      setMemberError(err.response?.data?.detail || 'Could not add member.');
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      await removeMember(id, userId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not remove member.');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(id);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete group.');
    }
  };

  const handleSettle = (balance) => {
    const fromId = balance.from_user.id;
    const toId = balance.to_user.id;
    navigate(`/groups/${id}/settle?from=${fromId}&to=${toId}&amount=${balance.amount}`);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="h-8 bg-slate-100 rounded animate-pulse w-48 mb-6" />
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-3">
          ← Back
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{group.name}</h1>
            {group.description && (
              <p className="text-slate-500 text-sm mt-0.5">{group.description}</p>
            )}
          </div>
          <Link
            to={`/groups/${id}/expenses/new`}
            className="btn-primary flex items-center gap-2"
          >
            + Add expense
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px
              ${tab === t
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
          >
            {t}
            {t === 'Expenses' && expenses.length > 0 && (
              <span className="ml-1.5 bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">
                {expenses.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* EXPENSES TAB */}
      {tab === 'Expenses' && (
        <div>
          {expenses.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-4xl mb-3">🧾</p>
              <p className="text-slate-600 font-medium">No expenses yet</p>
              <p className="text-slate-400 text-sm mt-1 mb-4">Add your first shared expense.</p>
              <Link to={`/groups/${id}/expenses/new`} className="btn-primary inline-block">
                Add expense
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => (
                <ExpenseCard key={exp.id} expense={exp} groupId={id} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* BALANCES TAB */}
      {tab === 'Balances' && (
        <div className="card p-4">
          {balances.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-slate-600 font-medium">All settled up!</p>
              <p className="text-slate-400 text-sm mt-1">No outstanding balances in this group.</p>
            </div>
          ) : (
            <div>
              {balances.map((b, i) => (
                <BalanceRow
                  key={i}
                  balance={b}
                  currentUserId={user?.id}
                  onSettle={handleSettle}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SETTLEMENTS TAB */}
      {tab === 'Settlements' && (
        <div>
          <div className="flex justify-end mb-4">
            <Link to={`/groups/${id}/settle`} className="btn-secondary text-sm">
              + Record payment
            </Link>
          </div>
          {settlements.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-3xl mb-2">💳</p>
              <p className="text-slate-600 font-medium">No settlements recorded</p>
              <p className="text-slate-400 text-sm mt-1 mb-4">Record a payment to settle a debt.</p>
              <Link to={`/groups/${id}/settle`} className="btn-primary inline-block">
                Record payment
              </Link>
            </div>
          ) : (
            <div className="card divide-y divide-slate-100">
              {settlements.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      <span className="text-brand-700">{s.paid_by.id === user?.id ? 'You' : s.paid_by.name}</span>
                      {' paid '}
                      <span className="text-slate-700">{s.paid_to.id === user?.id ? 'you' : s.paid_to.name}</span>
                    </p>
                    {s.notes && <p className="text-xs text-slate-400 mt-0.5">{s.notes}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(s.date)}</p>
                  </div>
                  <span className="font-semibold text-brand-600">{formatINR(s.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MEMBERS TAB */}
      {tab === 'Members' && (
        <div className="space-y-4">
          {/* Add member form (admin only) */}
          {isAdmin && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Add member by email</h3>
              {memberError && (
                <div className="text-red-600 text-xs mb-2 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                  {memberError}
                </div>
              )}
              <form onSubmit={handleAddMember} className="flex gap-2">
                <input
                  type="email"
                  className="input flex-1"
                  placeholder="friend@example.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  required
                />
                <button type="submit" disabled={memberLoading} className="btn-primary whitespace-nowrap">
                  {memberLoading ? 'Adding…' : 'Add'}
                </button>
              </form>
            </div>
          )}

          {/* Member list */}
          <div className="card divide-y divide-slate-100">
            {group.members?.map((m) => (
              <div key={m.user.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                    {m.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {m.user.name}
                      {m.user.id === group.created_by?.id && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">admin</span>
                      )}
                      {m.user.id === user?.id && (
                        <span className="ml-1 text-xs text-slate-400">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">{m.user.email}</p>
                  </div>
                </div>
                {isAdmin && m.user.id !== user?.id && (
                  <button
                    onClick={() => handleRemoveMember(m.user.id)}
                    className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Danger zone */}
          {isAdmin && (
            <div className="card p-4 border-red-100">
              <h3 className="text-sm font-semibold text-red-600 mb-2">Danger zone</h3>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="text-sm text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete group
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-600">Are you sure? This cannot be undone.</p>
                  <button onClick={handleDeleteGroup} className="btn-danger text-sm">Confirm delete</button>
                  <button onClick={() => setDeleteConfirm(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
