import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGroups } from '../api/groups';
import { getUserSummary } from '../api/balances';
import GroupCard from '../components/GroupCard';
import { formatINR } from '../utils/formatCurrency';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getGroups(), getUserSummary()])
      .then(([grRes, sumRes]) => {
        setGroups(grRes.data);
        setSummary(sumRes.data.summary);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalOwed = summary
    .filter((s) => parseFloat(s.net_amount) > 0)
    .reduce((acc, s) => acc + parseFloat(s.net_amount), 0);

  const totalOwe = summary
    .filter((s) => parseFloat(s.net_amount) < 0)
    .reduce((acc, s) => acc + parseFloat(s.net_amount), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Your groups and balance summary</p>
        </div>
        <Link to="/groups/new" className="btn-primary flex items-center gap-2">
          <span>+</span> New Group
        </Link>
      </div>

      {/* Balance Summary Cards */}
      {!loading && (totalOwed > 0 || Math.abs(totalOwe) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {totalOwed > 0 && (
            <div className="card p-5 border-l-4 border-brand-500">
              <p className="text-sm text-slate-500 mb-1">Total you are owed</p>
              <p className="text-2xl font-bold text-brand-600">{formatINR(totalOwed)}</p>
            </div>
          )}
          {Math.abs(totalOwe) > 0 && (
            <div className="card p-5 border-l-4 border-red-400">
              <p className="text-sm text-slate-500 mb-1">Total you owe</p>
              <p className="text-2xl font-bold text-red-500">{formatINR(Math.abs(totalOwe))}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-700 mb-3">Your Groups</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-4 animate-pulse h-16 bg-slate-100" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-4xl mb-3">🏠</p>
              <p className="text-slate-600 font-medium">No groups yet</p>
              <p className="text-slate-400 text-sm mt-1 mb-4">Create a group to start splitting expenses.</p>
              <Link to="/groups/new" className="btn-primary inline-block">Create your first group</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const groupNet = summary
                  .filter((s) => s.group_id === group.id)
                  .reduce((acc, s) => acc + parseFloat(s.net_amount), 0);
                return <GroupCard key={group.id} group={group} netAmount={undefined} />;
              })}
            </div>
          )}
        </div>

        {/* Individual Balance Summary */}
        <div>
          <h2 className="text-base font-semibold text-slate-700 mb-3">Balance Summary</h2>
          <div className="card p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : summary.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm text-slate-500">You're all settled up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.map((s) => {
                  const isOwed = parseFloat(s.net_amount) > 0;
                  return (
                    <div key={s.user.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                          {s.user.name.charAt(0)}
                        </div>
                        <span className="text-sm text-slate-700">{s.user.name}</span>
                      </div>
                      <span className={`text-sm font-semibold ${isOwed ? 'text-brand-600' : 'text-red-500'}`}>
                        {isOwed ? '+' : ''}{formatINR(s.net_amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
