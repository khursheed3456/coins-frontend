'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Copy, Users, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import { format } from 'date-fns';

export default function PortfolioPage() {
  const router = useRouter();
  const { user, init, isLoading } = useAuthStore();
  const [holdings, setHoldings] = useState([]);
  const [trades, setTrades] = useState([]);
  const [referrals, setReferrals] = useState(null);
  const [tab, setTab] = useState('holdings');
  const [loading, setLoading] = useState(true);

  useEffect(() => { init(); }, [init]);
  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get('/portfolio/holdings'),
      api.get('/portfolio/trades'),
      api.get('/portfolio/referrals'),
    ]).then(([hRes, tRes, rRes]) => {
      setHoldings(hRes.data.holdings);
      setTrades(tRes.data.trades);
      setReferrals(rRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const copyReferral = () => {
    if (!referrals?.referralCode) return;
    navigator.clipboard.writeText(referrals.referralCode);
    toast.success('Referral code copied!');
  };

  if (isLoading || loading || !user)
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>;

  const totalPortfolioValue = holdings.reduce((sum, h) => sum + parseFloat(h.currentValue), 0);
  const totalPnL = holdings.reduce((sum, h) => sum + parseFloat(h.pnl), 0);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-xl md:text-2xl font-bold text-text-primary mb-5">Portfolio</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="stat-card">
          <span className="stat-label">Portfolio Value</span>
          <span className="stat-value font-mono">PKR {totalPortfolioValue.toFixed(0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total PnL</span>
          <span className={`stat-value font-mono ${totalPnL >= 0 ? 'text-green-profit' : 'text-red-loss'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Referral Earnings</span>
          <span className="stat-value font-mono text-cyan">PKR {parseFloat(user.referralEarnings || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-bg-card border border-bg-border p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
        {['holdings', 'trades', 'referrals'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm capitalize transition-all whitespace-nowrap touch-manipulation flex-1 sm:flex-none
              ${tab === t ? 'bg-cyan text-bg-base font-semibold' : 'text-text-secondary hover:text-text-primary'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Holdings */}
      {tab === 'holdings' && (
        <div className="card">
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {holdings.map(h => (
              <div key={h.id} className="bg-bg-elevated border border-bg-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {h.coin.imageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={h.coin.imageUrl} alt={h.coin.symbol} className="w-7 h-7 rounded-full" />
                      : <div className="w-7 h-7 rounded-full bg-cyan/10 border border-cyan/20 flex items-center justify-center"><span className="text-cyan text-xs font-bold">{h.coin.symbol[0]}</span></div>
                    }
                    <div>
                      <p className="text-text-primary text-sm font-medium">{h.coin.name}</p>
                      <p className="text-text-muted text-xs font-mono">{h.coin.symbol}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-mono font-semibold ${h.pnl >= 0 ? 'text-green-profit' : 'text-red-loss'}`}>
                    {h.pnl >= 0 ? '+' : ''}{parseFloat(h.pnl).toFixed(2)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-text-muted">Amount: </span><span className="font-mono text-text-secondary">{parseFloat(h.amount).toFixed(4)}</span></div>
                  <div><span className="text-text-muted">Value: </span><span className="font-mono text-text-primary">PKR {parseFloat(h.currentValue).toFixed(0)}</span></div>
                  <div><span className="text-text-muted">Avg Buy: </span><span className="font-mono text-text-secondary">{parseFloat(h.avgBuyPrice).toFixed(4)}</span></div>
                  <div><span className="text-text-muted">Current: </span><span className="font-mono text-text-primary">{parseFloat(h.coin.currentPrice).toFixed(4)}</span></div>
                </div>
              </div>
            ))}
            {holdings.length === 0 && <p className="text-text-muted text-sm text-center py-8">No holdings yet. Start trading!</p>}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block table-wrap">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-bg-border">
                  {['Asset','Amount','Avg Buy','Current','Value','PnL'].map(h => (
                    <th key={h} className="text-left text-text-muted text-xs py-2 pb-3 font-normal pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => (
                  <tr key={h.id} className="border-b border-bg-border/40 hover:bg-bg-elevated/20 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {h.coin.imageUrl ? <img src={h.coin.imageUrl} alt={h.coin.symbol} className="w-7 h-7 rounded-full" />
                          : <div className="w-7 h-7 rounded-full bg-cyan/10 border border-cyan/20 flex items-center justify-center"><span className="text-cyan text-xs font-bold">{h.coin.symbol[0]}</span></div>}
                        <span className="text-text-primary text-sm font-medium">{h.coin.name}</span>
                        <span className="text-text-muted text-xs font-mono">{h.coin.symbol}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-mono text-sm text-text-secondary">{parseFloat(h.amount).toFixed(6)}</td>
                    <td className="py-3 pr-4 font-mono text-sm text-text-secondary">{parseFloat(h.avgBuyPrice).toFixed(6)}</td>
                    <td className="py-3 pr-4 font-mono text-sm text-text-primary">{parseFloat(h.coin.currentPrice).toFixed(6)}</td>
                    <td className="py-3 pr-4 font-mono text-sm text-text-primary">PKR {parseFloat(h.currentValue).toFixed(2)}</td>
                    <td className="py-3 pr-4">
                      <div className={`flex items-center gap-1 text-sm font-mono ${h.pnl >= 0 ? 'text-green-profit' : 'text-red-loss'}`}>
                        {h.pnl >= 0 ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
                        {h.pnl >= 0 ? '+' : ''}{parseFloat(h.pnl).toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))}
                {holdings.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-text-muted text-sm">No holdings yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trades */}
      {tab === 'trades' && (
        <div className="card">
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {trades.map(t => (
              <div key={t.id} className="bg-bg-elevated border border-bg-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-text-primary text-sm font-medium">{t.coin?.name}</span>
                    <span className="text-text-muted text-xs font-mono ml-2">{t.coin?.symbol}</span>
                  </div>
                  <span className={t.type === 'buy' ? 'badge-approved' : 'badge-rejected'}>{t.type.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div><span className="text-text-muted">Amount: </span><span className="font-mono">{parseFloat(t.amount).toFixed(4)}</span></div>
                  <div><span className="text-text-muted">Total: </span><span className="font-mono">PKR {parseFloat(t.totalValue).toFixed(0)}</span></div>
                  {t.type === 'sell' && <div className="col-span-2">
                    <span className="text-text-muted">PnL: </span>
                    <span className={`font-mono ${parseFloat(t.profitLoss) >= 0 ? 'text-green-profit' : 'text-red-loss'}`}>
                      {parseFloat(t.profitLoss) >= 0 ? '+' : ''}{parseFloat(t.profitLoss).toFixed(2)}
                    </span>
                  </div>}
                  <div className="col-span-2 text-text-muted">{format(new Date(t.createdAt), 'dd MMM yy HH:mm')}</div>
                </div>
              </div>
            ))}
            {trades.length === 0 && <p className="text-text-muted text-sm text-center py-8">No trades yet</p>}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block table-wrap">
            <table className="w-full min-w-[580px]">
              <thead>
                <tr className="border-b border-bg-border">
                  {['Coin','Type','Amount','Price','Total','PnL','Date'].map(h => (
                    <th key={h} className="text-left text-text-muted text-xs py-2 pb-3 font-normal pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t.id} className="border-b border-bg-border/40 hover:bg-bg-elevated/20">
                    <td className="py-3 pr-4 text-sm text-text-primary">{t.coin?.name} <span className="text-text-muted font-mono text-xs">{t.coin?.symbol}</span></td>
                    <td className="py-3 pr-4"><span className={t.type === 'buy' ? 'badge-approved' : 'badge-rejected'}>{t.type.toUpperCase()}</span></td>
                    <td className="py-3 pr-4 font-mono text-sm text-text-secondary">{parseFloat(t.amount).toFixed(6)}</td>
                    <td className="py-3 pr-4 font-mono text-sm text-text-secondary">{parseFloat(t.priceAtTrade).toFixed(6)}</td>
                    <td className="py-3 pr-4 font-mono text-sm text-text-primary">PKR {parseFloat(t.totalValue).toFixed(2)}</td>
                    <td className="py-3 pr-4 font-mono text-sm">
                      {t.type === 'sell'
                        ? <span className={parseFloat(t.profitLoss) >= 0 ? 'text-green-profit' : 'text-red-loss'}>{parseFloat(t.profitLoss) >= 0 ? '+' : ''}{parseFloat(t.profitLoss).toFixed(2)}</span>
                        : <span className="text-text-muted">—</span>}
                    </td>
                    <td className="py-3 text-text-muted text-xs">{format(new Date(t.createdAt), 'dd MMM yy HH:mm')}</td>
                  </tr>
                ))}
                {trades.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-text-muted text-sm">No trades yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Referrals */}
      {tab === 'referrals' && referrals && (
        <div className="space-y-4">
          <div className="card border-cyan/20">
            <p className="text-text-muted text-sm mb-2">Your Referral Code</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xl md:text-2xl font-bold text-cyan tracking-widest">{referrals.referralCode}</span>
              <button onClick={copyReferral} className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 touch-manipulation">
                <Copy size={13} /> Copy
              </button>
            </div>
            <p className="text-text-muted text-xs mt-2">Earn <span className="text-cyan font-semibold">30%</span> of your referral's first deposit automatically</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: referrals.totalReferrals, icon: Users, color: 'text-cyan' },
              { label: 'Verified', value: referrals.verifiedReferrals, icon: CheckCircle, color: 'text-green-profit' },
              { label: 'Pending', value: referrals.unverifiedReferrals, icon: Clock, color: 'text-yellow-400' },
              { label: 'Earned', value: `PKR ${parseFloat(referrals.totalEarnings).toFixed(0)}`, icon: null, color: 'text-cyan' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="flex items-center gap-1.5 mb-1">
                  {s.icon && <s.icon size={13} className={s.color} />}
                  <span className="stat-label text-xs">{s.label}</span>
                </div>
                <span className={`stat-value text-xl font-mono ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-display font-semibold text-text-primary mb-4 text-sm md:text-base">Referred Users</h3>
            {referrals.referrals.length === 0
              ? <p className="text-text-muted text-sm py-6 text-center">No referrals yet. Share your code!</p>
              : <div className="space-y-1">
                {referrals.referrals.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-bg-border/40 last:border-0 gap-2">
                    <span className="text-text-secondary text-xs sm:text-sm font-mono truncate">{r.email}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-text-muted text-xs hidden sm:block">{format(new Date(r.joinedAt), 'dd MMM yy')}</span>
                      {r.hasDeposited ? <span className="badge-approved">Verified</span> : <span className="badge-pending">Pending</span>}
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>
      )}
    </div>
  );
}
