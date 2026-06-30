'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, X } from 'lucide-react';
import api from '../../../lib/api';
import useAuthStore from '../../../store/authStore';
import { format } from 'date-fns';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, init, isLoading } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => { init(); }, []);
  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/auth/login');
      else if (user.role !== 'admin') router.push('/dashboard');
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    api.get(`/admin/users?page=${page}&limit=20`)
      .then(({ data }) => { setUsers(data.users); setTotal(data.total); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [user, page]);

  const openUserDetail = async (u) => {
    setSelectedUser(u);
    setShowDetail(true);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${u.id}`);
      setUserDetail(data);
    } catch { setUserDetail(null); }
    finally { setDetailLoading(false); }
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.referralCode || '').toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading || !user) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-text-primary">Users</h1>
          <p className="text-text-secondary text-sm mt-0.5">{total} registered accounts</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Search email or referral..." value={search}
            onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Users List */}
        <div className="xl:col-span-2 card">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>
          ) : (
            <>
              <div className="space-y-1">
                {filtered.map(u => (
                  <div key={u.id} onClick={() => openUserDetail(u)}
                    className={`flex items-center justify-between py-3 px-3 rounded-xl border transition-all cursor-pointer touch-manipulation
                      ${selectedUser?.id === u.id ? 'bg-cyan/5 border-cyan/20' : 'border-transparent hover:bg-bg-elevated/50 hover:border-bg-border'}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-text-primary text-sm truncate">{u.email}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-text-muted text-xs font-mono">{u.referralCode}</span>
                        <span className="font-mono text-xs text-text-secondary">PKR {parseFloat(u.balance || 0).toFixed(0)}</span>
                        {u.hasDeposited ? <span className="badge-approved text-xs">Deposited</span> : <span className="badge-pending text-xs">No Deposit</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-text-muted text-xs hidden sm:block">{format(new Date(u.createdAt), 'dd MMM yy')}</span>
                      <ChevronRight size={15} className="text-text-muted" />
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && <p className="text-text-muted text-sm text-center py-8">No users found</p>}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-bg-border">
                <p className="text-text-muted text-xs">Page {page} of {Math.ceil(total / 20)}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40 touch-manipulation">Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
                    className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40 touch-manipulation">Next</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detail Panel — desktop side, mobile overlay */}
        {showDetail && (
          <div className="xl:block">
            {/* Mobile overlay */}
            <div className="xl:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end" onClick={() => setShowDetail(false)}>
              <div className="w-full bg-bg-card border-t border-bg-border rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-text-primary font-medium text-sm truncate">{selectedUser?.email}</p>
                  <button onClick={() => setShowDetail(false)} className="text-text-muted hover:text-text-primary p-1 touch-manipulation"><X size={20} /></button>
                </div>
                <UserDetailContent userDetail={userDetail} loading={detailLoading} />
              </div>
            </div>

            {/* Desktop panel */}
            <div className="hidden xl:block card">
              {!selectedUser ? (
                <p className="text-text-muted text-sm text-center py-12">Select a user</p>
              ) : detailLoading ? (
                <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>
              ) : (
                <UserDetailContent userDetail={userDetail} loading={detailLoading} />
              )}
            </div>
          </div>
        )}

        {/* Desktop panel when nothing selected */}
        {!showDetail && (
          <div className="hidden xl:block card">
            <p className="text-text-muted text-sm text-center py-12">Select a user to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

function UserDetailContent({ userDetail, loading }) {
  if (loading) return <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>;
  if (!userDetail) return <p className="text-text-muted text-sm text-center py-8">Failed to load</p>;

  const u = userDetail.user;
  return (
    <div>
      <h3 className="font-display font-semibold text-text-primary mb-4 text-sm truncate">{u.email}</h3>
      <div className="space-y-2 text-xs mb-4">
        {[
          ['Balance', `PKR ${parseFloat(u.balance).toFixed(2)}`, 'font-mono text-text-primary'],
          ['Referral Earnings', `PKR ${parseFloat(u.referralEarnings).toFixed(2)}`, 'font-mono text-cyan'],
          ['Referral Code', u.referralCode, 'font-mono text-text-secondary'],
          ['Has Deposited', u.hasDeposited ? '✅ Yes' : '❌ No', ''],
          ['Verified', u.isVerified ? '✅ Yes' : '❌ No', ''],
          ['Joined', format(new Date(u.createdAt), 'dd MMM yyyy'), 'text-text-secondary'],
        ].map(([label, value, cls]) => (
          <div key={label} className="flex justify-between gap-2">
            <span className="text-text-muted">{label}</span>
            <span className={cls}>{value}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-bg-border pt-3 mb-3">
        <p className="text-text-muted text-xs mb-2">Deposits ({userDetail.deposits.length})</p>
        {userDetail.deposits.slice(0, 3).map(d => (
          <div key={d.id} className="flex justify-between text-xs py-1.5">
            <span className="font-mono text-text-secondary">PKR {parseFloat(d.amount).toLocaleString()}</span>
            <span className={`badge-${d.status}`}>{d.status}</span>
          </div>
        ))}
        {userDetail.deposits.length === 0 && <p className="text-text-muted text-xs">No deposits</p>}
      </div>

      <div className="border-t border-bg-border pt-3">
        <p className="text-text-muted text-xs mb-2">Recent Trades ({userDetail.trades.length})</p>
        {userDetail.trades.slice(0, 3).map(t => (
          <div key={t.id} className="flex justify-between text-xs py-1.5">
            <span className="text-text-secondary">{t.coin?.symbol} {t.type.toUpperCase()}</span>
            <span className="font-mono text-text-muted">PKR {parseFloat(t.totalValue).toFixed(0)}</span>
          </div>
        ))}
        {userDetail.trades.length === 0 && <p className="text-text-muted text-xs">No trades</p>}
      </div>
    </div>
  );
}
