'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Coins, ArrowDownCircle, ArrowUpCircle, UserPlus, BarChart3, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, init, isLoading } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { init(); }, []);
  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/auth/login');
      else if (user.role !== 'admin') router.push('/dashboard');
    }
  }, [user, isLoading]);

  const fetchData = async () => {
    try {
      const [sRes, dRes, wRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/deposits?status=pending'),
        api.get('/admin/withdrawals?status=pending'),
      ]);
      setStats(sRes.data);
      setPendingDeposits(dRes.data.deposits.slice(0, 5));
      setPendingWithdrawals(wRes.data.withdrawals.slice(0, 5));
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.role === 'admin') fetchData(); }, [user]);

  // Auto refresh every 30s
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (isLoading || !user || loading) return (
    <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-text-primary">Admin Overview</h1>
          <p className="text-text-secondary text-sm mt-0.5">Manage CoinX444 platform</p>
        </div>
        <button onClick={fetchData} className="text-text-muted hover:text-cyan p-2 transition-colors touch-manipulation">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Users,          label: 'Total Users',    value: stats?.totalUsers,        color: 'text-cyan'         },
          { icon: UserPlus,       label: 'New Today',      value: stats?.newUsers24h,       color: 'text-green-profit' },
          { icon: ArrowDownCircle,label: 'Pending Deposits',value: stats?.pendingDeposits,  color: 'text-yellow-400'   },
          { icon: ArrowUpCircle,  label: 'Pending Withdrawals',value: stats?.pendingWithdrawals, color: 'text-red-loss'},
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={14} className={s.color} />
              <span className="stat-label text-xs">{s.label}</span>
            </div>
            <span className={`stat-value ${s.color}`}>{s.value ?? '—'}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Pending Deposits */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-text-primary text-sm md:text-base">Pending Deposits</h2>
            <Link href="/admin/deposits" className="text-cyan text-xs hover:text-cyan-dim">View all →</Link>
          </div>
          {pendingDeposits.length === 0
            ? <p className="text-text-muted text-sm py-4 text-center">No pending deposits</p>
            : <div className="space-y-1">
              {pendingDeposits.map(d => (
                <div key={d.id} className="flex items-center justify-between py-2.5 border-b border-bg-border/40 last:border-0 gap-2">
                  <div className="min-w-0">
                    <p className="text-text-primary text-sm font-mono font-semibold">PKR {parseFloat(d.amount).toLocaleString()}</p>
                    <p className="text-text-muted text-xs truncate">{d.user?.email} · {d.method}</p>
                  </div>
                  <Link href="/admin/deposits" className="text-cyan text-xs hover:text-cyan-dim flex-shrink-0">Review →</Link>
                </div>
              ))}
            </div>
          }
        </div>

        {/* Pending Withdrawals */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-text-primary text-sm md:text-base">Pending Withdrawals</h2>
            <Link href="/admin/withdrawals" className="text-cyan text-xs hover:text-cyan-dim">View all →</Link>
          </div>
          {pendingWithdrawals.length === 0
            ? <p className="text-text-muted text-sm py-4 text-center">No pending withdrawals</p>
            : <div className="space-y-1">
              {pendingWithdrawals.map(w => (
                <div key={w.id} className="flex items-center justify-between py-2.5 border-b border-bg-border/40 last:border-0 gap-2">
                  <div className="min-w-0">
                    <p className="text-text-primary text-sm font-mono font-semibold">PKR {parseFloat(w.amount).toLocaleString()}</p>
                    <p className="text-text-muted text-xs truncate">{w.user?.email} · {w.withdrawalType}</p>
                  </div>
                  <Link href="/admin/withdrawals" className="text-cyan text-xs hover:text-cyan-dim flex-shrink-0">Review →</Link>
                </div>
              ))}
            </div>
          }
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/admin/coins',       icon: Coins,            label: 'Manage Coins',   desc: 'Create & configure' },
          { href: '/admin/deposits',    icon: ArrowDownCircle,  label: 'Deposits',       desc: 'Approve or reject'  },
          { href: '/admin/withdrawals', icon: ArrowUpCircle,    label: 'Withdrawals',    desc: 'Process requests'   },
          { href: '/admin/users',       icon: Users,            label: 'Users',          desc: 'View all accounts'  },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href} className="card-hover touch-manipulation">
            <Icon size={18} className="text-cyan mb-2" />
            <p className="font-medium text-text-primary text-sm">{label}</p>
            <p className="text-text-muted text-xs mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
