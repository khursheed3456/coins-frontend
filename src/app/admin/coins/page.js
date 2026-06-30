'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Coins, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import useAuthStore from '../../../store/authStore';

export default function AdminCoinsPage() {
  const router = useRouter();
  const { user, init, isLoading } = useAuthStore();
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', symbol: '', totalSupply: '', marketCap: '', imageUrl: '', description: '' });

  useEffect(() => { init(); }, []);
  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/auth/login');
      else if (user.role !== 'admin') router.push('/dashboard');
    }
  }, [user, isLoading]);

  const fetchCoins = () => {
    api.get('/admin/coins').then(({ data }) => setCoins(data.coins)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { if (user?.role === 'admin') fetchCoins(); }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/admin/coins', {
        ...form, totalSupply: parseFloat(form.totalSupply), marketCap: parseFloat(form.marketCap),
      });
      toast.success(`${data.coin.name} launched!`);
      setCoins(prev => [data.coin, ...prev]);
      setForm({ name: '', symbol: '', totalSupply: '', marketCap: '', imageUrl: '', description: '' });
      setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const toggleActive = async (coin) => {
    try {
      await api.patch(`/admin/coins/${coin.id}`, { isActive: !coin.isActive });
      setCoins(prev => prev.map(c => c.id === coin.id ? { ...c, isActive: !c.isActive } : c));
      toast.success(`${coin.name} ${coin.isActive ? 'deactivated' : 'activated'}`);
    } catch { toast.error('Failed to update'); }
  };

  if (isLoading || !user) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-text-primary">Manage Coins</h1>
          <p className="text-text-secondary text-sm mt-0.5">{coins.length} coins created</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 self-start sm:self-auto touch-manipulation">
          <Plus size={16} /> {showForm ? 'Cancel' : 'Create Coin'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 animate-slide-up">
          <h2 className="font-display font-semibold text-text-primary mb-4 text-sm md:text-base">Launch New Coin</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">Coin Name</label>
              <input type="text" className="input" placeholder="e.g. Bitcoin"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">Symbol</label>
              <input type="text" className="input font-mono uppercase" placeholder="e.g. BTC"
                value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })} maxLength={10} required />
            </div>
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">Total Supply</label>
              <input type="number" className="input font-mono" placeholder="e.g. 21000000"
                value={form.totalSupply} onChange={e => setForm({ ...form, totalSupply: e.target.value })} required />
            </div>
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">Market Cap (PKR)</label>
              <input type="number" className="input font-mono" placeholder="e.g. 100000000"
                value={form.marketCap} onChange={e => setForm({ ...form, marketCap: e.target.value })} required />
            </div>
            <div className="sm:col-span-2">
              <label className="text-text-secondary text-sm mb-1.5 block">Image URL <span className="text-text-muted">(optional)</span></label>
              <input type="url" className="input" placeholder="https://..."
                value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-text-secondary text-sm mb-1.5 block">Description <span className="text-text-muted">(optional)</span></label>
              <textarea className="input resize-none" rows={2} placeholder="Brief description..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          {form.totalSupply && form.marketCap && (
            <div className="mt-4 bg-cyan/5 border border-cyan/20 rounded-lg px-4 py-2.5 text-sm">
              <span className="text-text-muted">Initial Price: </span>
              <span className="text-cyan font-mono font-semibold">PKR {(parseFloat(form.marketCap) / parseFloat(form.totalSupply)).toFixed(8)}</span>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 touch-manipulation">
              {submitting ? <span className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" /> : <Coins size={15} />}
              {submitting ? 'Launching...' : 'Launch Coin'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary touch-manipulation">Cancel</button>
          </div>
        </form>
      )}

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>
          : coins.map(coin => {
          const change = parseFloat(coin.priceChange24h || 0);
          return (
            <div key={coin.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {coin.imageUrl ? <img src={coin.imageUrl} alt={coin.symbol} className="w-8 h-8 rounded-full" />
                    : <div className="w-8 h-8 rounded-full bg-cyan/10 border border-cyan/20 flex items-center justify-center"><span className="text-cyan text-sm font-bold">{coin.symbol[0]}</span></div>}
                  <div>
                    <p className="text-text-primary font-medium text-sm">{coin.name}</p>
                    <p className="text-text-muted text-xs font-mono">{coin.symbol}</p>
                  </div>
                </div>
                <button onClick={() => toggleActive(coin)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all touch-manipulation ${coin.isActive ? 'border-red-loss/30 text-red-loss hover:bg-red-loss/10' : 'border-green-profit/30 text-green-profit hover:bg-green-profit/10'}`}>
                  <Power size={11} /> {coin.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-text-muted">Price: </span><span className="font-mono text-text-primary">{parseFloat(coin.currentPrice).toFixed(6)}</span></div>
                <div><span className="text-text-muted">24h: </span><span className={change >= 0 ? 'badge-profit' : 'badge-loss'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span></div>
                <div><span className="text-text-muted">Buy Vol: </span><span className="font-mono text-green-profit">{parseFloat(coin.totalBuyVolume || 0).toFixed(2)}</span></div>
                <div><span className="text-text-muted">Sell Vol: </span><span className="font-mono text-red-loss">{parseFloat(coin.totalSellVolume || 0).toFixed(2)}</span></div>
              </div>
            </div>
          );
        })}
        {!loading && coins.length === 0 && <p className="text-text-muted text-sm text-center py-8">No coins yet. Create your first coin!</p>}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card">
        {loading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>
          : (
            <div className="table-wrap">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-bg-border">
                    {['Coin','Symbol','Price','MCap','Supply','Buy Vol','Sell Vol','24h','Status','Action'].map(h => (
                      <th key={h} className="text-left text-text-muted text-xs py-2 pb-3 font-normal pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coins.map(coin => {
                    const change = parseFloat(coin.priceChange24h || 0);
                    return (
                      <tr key={coin.id} className="border-b border-bg-border/40 hover:bg-bg-elevated/20 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            {coin.imageUrl ? <img src={coin.imageUrl} alt={coin.symbol} className="w-6 h-6 rounded-full" />
                              : <div className="w-6 h-6 rounded-full bg-cyan/10 border border-cyan/20 flex items-center justify-center"><span className="text-cyan text-xs font-bold">{coin.symbol[0]}</span></div>}
                            <span className="text-text-primary text-sm">{coin.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-mono text-text-muted text-xs">{coin.symbol}</td>
                        <td className="py-3 pr-4 font-mono text-text-primary text-sm">{parseFloat(coin.currentPrice).toFixed(6)}</td>
                        <td className="py-3 pr-4 font-mono text-text-secondary text-xs">{parseFloat(coin.marketCap).toLocaleString()}</td>
                        <td className="py-3 pr-4 font-mono text-text-secondary text-xs">{parseFloat(coin.totalSupply).toLocaleString()}</td>
                        <td className="py-3 pr-4 font-mono text-green-profit text-xs">{parseFloat(coin.totalBuyVolume || 0).toFixed(2)}</td>
                        <td className="py-3 pr-4 font-mono text-red-loss text-xs">{parseFloat(coin.totalSellVolume || 0).toFixed(2)}</td>
                        <td className="py-3 pr-4"><span className={change >= 0 ? 'badge-profit' : 'badge-loss'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span></td>
                        <td className="py-3 pr-4"><span className={coin.isActive ? 'badge-approved' : 'badge-rejected'}>{coin.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td className="py-3">
                          <button onClick={() => toggleActive(coin)}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all touch-manipulation ${coin.isActive ? 'border-red-loss/30 text-red-loss hover:bg-red-loss/10' : 'border-green-profit/30 text-green-profit hover:bg-green-profit/10'}`}>
                            <Power size={10} /> {coin.isActive ? 'Off' : 'On'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {coins.length === 0 && <tr><td colSpan={10} className="py-12 text-center text-text-muted text-sm">No coins yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
