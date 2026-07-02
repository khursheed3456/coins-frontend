'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, ShoppingCart, DollarSign } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import useAuthStore from '../../../store/authStore';
import PriceChart from '../../../components/charts/PriceChart';

export default function CoinDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, init, isLoading, updateUser } = useAuthStore();
  const [coin, setCoin] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [holding, setHolding] = useState(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [tab, setTab] = useState('buy');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { init(); }, [init]);
  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading]);

  const fetchCoin = async () => {
    try {
      const { data } = await api.get(`/coins/${id}`);
      setCoin(data.coin); setPriceHistory(data.priceHistory || []);
    } catch { router.push('/coins'); }
    finally { setLoading(false); }
  };

  const fetchHolding = async () => {
    try {
      const { data } = await api.get('/portfolio/holdings');
      setHolding(data.holdings.find(h => h.coin.id === id) || null);
    } catch {}
  };

  useEffect(() => { if (user) { fetchCoin(); fetchHolding(); } }, [user, id]);

  useEffect(() => {
    if (!coin) return;
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';
    const ws = new WebSocket(`${WS_URL}/ws/prices`);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'price_update' && msg.coinId === id)
          setCoin(prev => prev ? { ...prev, currentPrice: msg.price } : prev);
      } catch {}
    };
    return () => ws.close();
  }, [coin?.id]);

  const handleBuy = async () => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/coins/${id}/buy`, { amount: parseFloat(buyAmount) });
      toast.success(`Bought ${parseFloat(data.coinsReceived).toFixed(6)} ${coin.symbol}`);
      updateUser({ balance: data.newBalance });
      setBuyAmount('');
      fetchCoin(); fetchHolding();
    } catch (err) { toast.error(err.response?.data?.error || 'Buy failed'); }
    finally { setSubmitting(false); }
  };

  const handleSell = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/coins/${id}/sell`, { coinAmount: parseFloat(sellAmount) });
      const pnl = parseFloat(data.profitLoss);
      toast.success(`Sold for PKR ${parseFloat(data.pkrReceived).toFixed(2)} | PnL: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`);
      updateUser({ balance: data.newBalance });
      setSellAmount('');
      fetchCoin(); fetchHolding();
    } catch (err) { toast.error(err.response?.data?.error || 'Sell failed'); }
    finally { setSubmitting(false); }
  };

  if (loading || isLoading || !user) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>;
  if (!coin) return null;

  const change = parseFloat(coin.priceChange24h || 0);
  const positive = change >= 0;
  const estimatedCoins = buyAmount ? (parseFloat(buyAmount) / parseFloat(coin.currentPrice)).toFixed(6) : '0';
  const estimatedPKR = sellAmount ? (parseFloat(sellAmount) * parseFloat(coin.currentPrice)).toFixed(2) : '0';

  return (
    <div className="animate-fade-in">
      <Link href="/coins" className="flex items-center gap-2 text-text-secondary hover:text-cyan text-sm mb-4 transition-colors w-fit touch-manipulation">
        <ArrowLeft size={15} /> Markets
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          {coin.imageUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={coin.imageUrl} alt={coin.symbol} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" />
            : <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-cyan/10 border border-cyan/20 flex items-center justify-center flex-shrink-0"><span className="text-cyan text-lg font-bold">{coin.symbol[0]}</span></div>
          }
          <div>
            <h1 className="font-display text-lg md:text-2xl font-bold text-text-primary">{coin.name}</h1>
            <p className="text-text-muted font-mono text-sm">{coin.symbol}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-display text-xl md:text-3xl font-bold text-text-primary font-mono">
            {parseFloat(coin.currentPrice).toFixed(4)}
          </p>
          <span className={`inline-flex items-center gap-1 text-xs ${positive ? 'badge-profit' : 'badge-loss'}`}>
            {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {positive ? '+' : ''}{change.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-display font-semibold text-text-primary text-sm md:text-base">Price Chart (24h)</h2>
            <div className="flex gap-3 text-xs text-text-muted font-mono flex-wrap">
              <span>Supply: {parseFloat(coin.totalSupply).toLocaleString()}</span>
              <span>MCap: PKR {parseFloat(coin.marketCap).toLocaleString()}</span>
            </div>
          </div>
          {priceHistory.length > 1
            ? <PriceChart data={priceHistory} coinName={coin.name} height={220} />
            : <div className="h-48 flex items-center justify-center text-text-muted text-sm border border-dashed border-bg-border rounded-lg">Price history builds as trades occur</div>
          }
        </div>

        {/* Trade Panel */}
        <div className="flex flex-col gap-3">
          {holding && (
            <div className="card border-cyan/20">
              <p className="text-text-muted text-xs mb-2">Your Position</p>
              <p className="font-mono text-text-primary font-semibold">{parseFloat(holding.amount).toFixed(6)} {coin.symbol}</p>
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-text-muted">Avg Buy</span>
                <span className="font-mono text-text-secondary">{parseFloat(holding.avgBuyPrice).toFixed(6)}</span>
              </div>
              <div className="flex justify-between mt-1 text-xs">
                <span className="text-text-muted">PnL</span>
                <span className={`font-mono ${holding.pnl >= 0 ? 'text-green-profit' : 'text-red-loss'}`}>
                  {holding.pnl >= 0 ? '+' : ''}{parseFloat(holding.pnl).toFixed(2)} PKR
                </span>
              </div>
            </div>
          )}

          <div className="card">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setTab('buy')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all touch-manipulation ${tab === 'buy' ? 'bg-green-profit/15 text-green-profit border border-green-profit/30' : 'text-text-muted hover:text-text-secondary'}`}>
                Buy
              </button>
              <button onClick={() => setTab('sell')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all touch-manipulation ${tab === 'sell' ? 'bg-red-loss/15 text-red-loss border border-red-loss/30' : 'text-text-muted hover:text-text-secondary'}`}>
                Sell
              </button>
            </div>

            {tab === 'buy' ? (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">Amount (PKR)</label>
                  <input type="number" className="input font-mono" placeholder="Enter PKR"
                    value={buyAmount} onChange={e => setBuyAmount(e.target.value)} />
                </div>
                <div className="flex justify-between text-xs text-text-muted bg-bg-elevated rounded-lg px-3 py-2">
                  <span>You receive</span>
                  <span className="font-mono text-text-secondary">{estimatedCoins} {coin.symbol}</span>
                </div>
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Balance</span>
                  <span className="font-mono">PKR {parseFloat(user.balance || 0).toFixed(0)}</span>
                </div>
                <button onClick={handleBuy} disabled={submitting} className="btn-success flex items-center justify-center gap-2 touch-manipulation">
                  {submitting ? <span className="w-4 h-4 border-2 border-green-profit/30 border-t-green-profit rounded-full animate-spin" /> : <ShoppingCart size={15} />}
                  {submitting ? 'Processing...' : `Buy ${coin.symbol}`}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">Amount ({coin.symbol})</label>
                  <input type="number" className="input font-mono" placeholder={`Enter ${coin.symbol}`}
                    value={sellAmount} onChange={e => setSellAmount(e.target.value)} />
                </div>
                <div className="flex justify-between text-xs text-text-muted bg-bg-elevated rounded-lg px-3 py-2">
                  <span>You receive</span>
                  <span className="font-mono text-text-secondary">PKR {estimatedPKR}</span>
                </div>
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Holding</span>
                  <span className="font-mono">{holding ? parseFloat(holding.amount).toFixed(6) : '0'} {coin.symbol}</span>
                </div>
                <button onClick={handleSell} disabled={submitting} className="btn-danger flex items-center justify-center gap-2 touch-manipulation">
                  {submitting ? <span className="w-4 h-4 border-2 border-red-loss/30 border-t-red-loss rounded-full animate-spin" /> : <DollarSign size={15} />}
                  {submitting ? 'Processing...' : `Sell ${coin.symbol}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
