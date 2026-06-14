import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getGroup, addMember, removeMember, deleteGroup } from '../api/groups';
import { getExpenses } from '../api/expenses';
import { getGroupBalances, getGroupSimplifiedBalances } from '../api/balances';
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
  const [simplifiedBalances, setSimplifiedBalances] = useState([]);
  const [simplify, setSimplify] = useState(true);
  const [settlements, setSettlements] = useState([]);
  const [tab, setTab] = useState('Expenses');
  const [loading, setLoading] = useState(true);
  const [selectedAuditBalance, setSelectedAuditBalance] = useState(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const isAdmin = group?.created_by?.id === user?.id;

  const loadData = async () => {
    try {
      const [grRes, expRes, balRes, simpRes, setRes] = await Promise.all([
        getGroup(id),
        getExpenses(id),
        getGroupBalances(id),
        getGroupSimplifiedBalances(id),
        getSettlements(id),
      ]);
      setGroup(grRes.data);
      setExpenses(expRes.data);
      setBalances(balRes.data.balances);
      setSimplifiedBalances(simpRes.data.balances);
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
          <div className="flex items-center gap-2">
            <Link
              to={`/groups/${id}/import`}
              className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-sm"
            >
              📥 Import CSV
            </Link>
            <Link
              to={`/groups/${id}/expenses/new`}
              className="btn-primary flex items-center gap-2 py-2 px-3 text-sm"
            >
              + Add expense
            </Link>
          </div>
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
              <p className="text-slate-400 text-sm mt-1 mb-4">Add your first shared expense or import a CSV file.</p>
              <div className="flex justify-center gap-3">
                <Link to={`/groups/${id}/import`} className="btn-secondary inline-block">
                  Import CSV
                </Link>
                <Link to={`/groups/${id}/expenses/new`} className="btn-primary inline-block">
                  Add expense
                </Link>
              </div>
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
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-700">Simplify Debts (Aisha's View)</p>
              <p className="text-xs text-slate-500">Minimizes the number of payments between flatmates</p>
            </div>
            <button
              onClick={() => setSimplify(!simplify)}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                simplify ? 'bg-brand-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform duration-200 ${
                  simplify ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="card p-4">
            {(simplify ? simplifiedBalances : balances).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-slate-600 font-medium">All settled up!</p>
                <p className="text-slate-400 text-sm mt-1">No outstanding balances in this group.</p>
              </div>
            ) : (
              <div>
                {(simplify ? simplifiedBalances : balances).map((b, i) => (
                  <BalanceRow
                    key={i}
                    balance={b}
                    currentUserId={user?.id}
                    onSettle={handleSettle}
                    onSelect={() => setSelectedAuditBalance(b)}
                  />
                ))}
              </div>
            )}
          </div>
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

      {/* Pairwise Debt Audit Modal/Drawer */}
      {selectedAuditBalance && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Pairwise Debt Audit Ledger</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological split audit trail between <strong>{selectedAuditBalance.from_user.name}</strong> and <strong>{selectedAuditBalance.to_user.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedAuditBalance(null)}
                className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 transition-colors text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Audit Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {(() => {
                const uA = selectedAuditBalance.from_user;
                const uB = selectedAuditBalance.to_user;
                
                // Generate ledger items
                const ledger = [];
                
                // 1. Expenses splits
                expenses.forEach((exp) => {
                  const splitA = exp.splits?.find((s) => s.user.id === uA.id);
                  const splitB = exp.splits?.find((s) => s.user.id === uB.id);
                  const isAPayer = exp.paid_by?.id === uA.id;
                  const isBPayer = exp.paid_by?.id === uB.id;
                  
                  if (isBPayer && splitA) {
                    // B paid, A owes splitA.owed_amount (A's debt to B increases)
                    ledger.push({
                      date: exp.date,
                      title: exp.title,
                      amount: exp.amount,
                      original_amount: exp.original_amount,
                      currency: exp.currency,
                      exchange_rate: exp.exchange_rate,
                      type: 'expense',
                      description: `${uB.name} paid: ${exp.title} (your split)`,
                      owed_amount: parseFloat(splitA.owed_amount),
                      effect: 'increase',
                    });
                  } else if (isAPayer && splitB) {
                    // A paid, B owes splitB.owed_amount (A's debt to B decreases)
                    ledger.push({
                      date: exp.date,
                      title: exp.title,
                      amount: exp.amount,
                      original_amount: exp.original_amount,
                      currency: exp.currency,
                      exchange_rate: exp.exchange_rate,
                      type: 'expense',
                      description: `You paid: ${exp.title} (${uB.name}'s split)`,
                      owed_amount: -parseFloat(splitB.owed_amount),
                      effect: 'decrease',
                    });
                  }
                });
                
                // 2. Settlements
                settlements.forEach((s) => {
                  const isAPayer = s.paid_by.id === uA.id;
                  const isBPayer = s.paid_by.id === uB.id;
                  const isAToB = isAPayer && s.paid_to.id === uB.id;
                  const isBToA = isBPayer && s.paid_to.id === uA.id;
                  
                  if (isAToB) {
                    // A paid B (A's debt to B decreases)
                    ledger.push({
                      date: s.date,
                      title: 'Recorded Repayment',
                      amount: s.amount,
                      type: 'settlement',
                      description: `You paid / settled with ${uB.name}`,
                      owed_amount: -parseFloat(s.amount),
                      effect: 'decrease',
                    });
                  } else if (isBToA) {
                    // B paid A (A's debt to B increases)
                    ledger.push({
                      date: s.date,
                      title: 'Recorded Repayment',
                      amount: s.amount,
                      type: 'settlement',
                      description: `${uB.name} paid / settled with you`,
                      owed_amount: parseFloat(s.amount),
                      effect: 'increase',
                    });
                  }
                });
                
                // Sort chronologically
                ledger.sort((x, y) => new Date(x.date) - new Date(y.date));
                
                if (ledger.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      No direct transaction splits found between these members.
                    </div>
                  );
                }
                
                // Calculate running balances
                let balanceAccumulator = 0;
                const ledgerWithRunning = ledger.map((item) => {
                  balanceAccumulator += item.owed_amount;
                  return { ...item, running_balance: balanceAccumulator };
                });
                
                return (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Transaction Info</th>
                          <th className="px-4 py-2.5 text-right">Owed Share</th>
                          <th className="px-4 py-2.5 text-right">Running Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ledgerWithRunning.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 whitespace-nowrap text-slate-400 font-mono">
                              {formatDate(item.date)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-700 block">{item.description}</span>
                              {item.currency && item.currency !== 'INR' && (
                                <span className="text-[10px] text-slate-400 mt-1 inline-block bg-brand-50/50 border border-brand-100 rounded px-1.5 py-0.5">
                                  Conversion Audit: {item.currency} {item.original_amount} @ rate of {item.exchange_rate}
                                </span>
                              )}
                            </td>
                            <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${item.owed_amount < 0 ? 'text-brand-600' : 'text-red-500'}`}>
                              {item.owed_amount < 0 ? '' : '+'}{formatINR(item.owed_amount)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-700 font-mono">
                              {formatINR(item.running_balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="text-[10px] text-slate-400 max-w-[70%] font-medium">
                Note: A positive net balance indicates {selectedAuditBalance.from_user.name} owes {selectedAuditBalance.to_user.name}. Direct balances are calculated prior to Simplified Debt netting.
              </div>
              <button
                onClick={() => setSelectedAuditBalance(null)}
                className="btn-primary py-1.5 px-4 text-xs font-semibold shadow-sm"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
