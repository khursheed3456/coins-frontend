'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Wallet, ArrowDownCircle, ArrowUpCircle, Activity } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import MiniChart from '../../components/charts/MiniChart';

export default function DashboardPage() {
  const router = useRouter();
  const { user, init, isLoading, updateUser } = useAuthStore();
  const [coins, setCoins] = useState([]);
  const [summary, setSummary] = useState(null);
  const [priceHistories, setPriceHistories] = useState({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => { init(); }, [init]);
  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [coinsRes, summaryRes, meRes] = await Promise.all([
          api.get('/coins'), api.get('/portfolio/summary'), api.get('/auth/me'),
        ]);
        setCoins(coinsRes.data.coins);
        setSummary(summaryRes.data);
        updateUser(meRes.data);
        const histories = {};
        await Promise.all(coinsRes.data.coins.slice(0, 8).map(async (coin) => {
          try {
            const r = await api.get(`/coins/${coin.id}`);
            histories[coin.id] = r.data.priceHistory?.slice(-20) || [];
          } catch {}
        }));
        setPriceHistories(histories);
      } catch {}
      finally { setLoadingData(false); }
    };
    fetchData();
  }, [user]);

  // Live price WS
  useEffect(() => {
    if (!user) return;
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
    const ws = new WebSocket(`${WS_URL}/ws/prices`);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'price_update')
          setCoins(prev => prev.map(c => c.id === msg.coinId ? { ...c, currentPrice: msg.price } : c));
      } catch {}
    };
    return () => ws.close();
  }, [user]);

  if (isLoading || !user || loadingData)
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>;

  const totalPnl = summary?.totalPnl24h || 0;
  const pnlPositive = totalPnl >= 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-0.5">Welcome, {user.email.split('@')[0]}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/deposit" className="btn-primary flex items-center gap-1.5 text-xs md:text-sm">
            <ArrowDownCircle size={15} /> Deposit
          </Link>
          <Link href="/withdrawal" className="btn-secondary flex items-center gap-1.5 text-xs md:text-sm">
            <ArrowUpCircle size={15} /> Withdraw
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={15} className="text-cyan" />
            <span className="stat-label">Balance</span>
          </div>
          <p className="stat-value font-mono">PKR {parseFloat(user.balance || 0).toLocaleString('en', { minimumFractionDigits: 0 })}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            {pnlPositive ? <TrendingUp size={15} className="text-green-profit" /> : <TrendingDown size={15} className="text-red-loss" />}
            <span className="stat-label">24h PnL</span>
          </div>
          <p className={`stat-value font-mono ${pnlPositive ? 'text-green-profit' : 'text-red-loss'}`}>
            {pnlPositive ? '+' : ''}{parseFloat(totalPnl).toFixed(2)}
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={15} className="text-cyan" />
            <span className="stat-label">Referral Earnings</span>
          </div>
          <p className="stat-value font-mono text-cyan">PKR {parseFloat(user.referralEarnings || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Markets */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-text-primary text-sm md:text-base">Live Markets</h2>
          <Link href="/coins" className="text-cyan text-xs md:text-sm hover:text-cyan-dim">View all →</Link>
        </div>
        <div className="table-wrap">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-bg-border">
                {['#', 'Coin', 'Price (PKR)', '24h', 'Chart', ''].map(h => (
                  <th key={h} className="text-left text-text-muted text-xs py-2 pb-3 font-normal pr-4 last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coins.map((coin, idx) => {
                const change = parseFloat(coin.priceChange24h || 0);
                const positive = change >= 0;
                return (
                  <tr key={coin.id} className="border-b border-bg-border/40 hover:bg-bg-elevated/20 transition-colors">
                    <td className="py-3 pr-4 text-text-muted text-xs font-mono">{idx + 1}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {coin.imageUrl
                          ? <img src={coin.imageUrl} alt={coin.symbol} className="w-7 h-7 rounded-full object-cover" />
                          : <div className="w-7 h-7 rounded-full bg-cyan/10 border border-cyan/20 flex items-center justify-center flex-shrink-0"><span className="text-cyan text-xs font-bold">{coin.symbol[0]}</span></div>
                        }
                        <div className="min-w-0">
                          <p className="text-text-primary text-sm font-medium truncate">{coin.name}</p>
                          <p className="text-text-muted text-xs font-mono">{coin.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono text-sm text-text-primary">{parseFloat(coin.currentPrice).toFixed(4)}</td>
                    <td className="py-3 pr-4">
                      <span className={positive ? 'badge-profit' : 'badge-loss'}>{positive ? '+' : ''}{change.toFixed(2)}%</span>
                    </td>
                    <td className="py-3 pr-4">
                      <MiniChart data={priceHistories[coin.id] || []} isPositive={positive} />
                    </td>
                    <td className="py-3 text-right">
                      <Link href={`/coins/${coin.id}`} className="text-cyan text-xs hover:text-cyan-dim">Trade →</Link>
                    </td>
                  </tr>
                );
              })}
              {coins.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-text-muted text-sm">No coins listed yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
