'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import MiniChart from '../../components/charts/MiniChart';

export default function CoinsPage() {
  const router = useRouter();
  const { user, init, isLoading } = useAuthStore();
  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [histories, setHistories] = useState({});

  useEffect(() => { init(); }, []);
  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading]);

  useEffect(() => {
    if (!user) return;
    api.get('/coins').then(async ({ data }) => {
      setCoins(data.coins);
      setLoading(false);
      const h = {};
      await Promise.all(data.coins.map(async coin => {
        try {
          const r = await api.get(`/coins/${coin.id}`);
          h[coin.id] = r.data.priceHistory?.slice(-20) || [];
        } catch {}
      }));
      setHistories(h);
    }).catch(() => setLoading(false));
  }, [user]);

  const filtered = coins.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-text-primary">Markets</h1>
          <p className="text-text-secondary text-sm mt-0.5">{coins.length} coins listed</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Search coin..." value={search}
            onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {filtered.map(coin => {
            const change = parseFloat(coin.priceChange24h || 0);
            const positive = change >= 0;
            return (
              <Link key={coin.id} href={`/coins/${coin.id}`} className="card-hover block">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {coin.imageUrl
                      ? <img src={coin.imageUrl} alt={coin.symbol} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                      : <div className="w-9 h-9 rounded-full bg-cyan/10 border border-cyan/20 flex items-center justify-center flex-shrink-0"><span className="text-cyan font-bold text-sm">{coin.symbol[0]}</span></div>
                    }
                    <div className="min-w-0">
                      <p className="text-text-primary font-medium truncate">{coin.name}</p>
                      <p className="text-text-muted text-xs font-mono">{coin.symbol}</p>
                    </div>
                  </div>
                  <span className={positive ? 'badge-profit' : 'badge-loss'}>{positive ? '+' : ''}{change.toFixed(2)}%</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-text-muted text-xs mb-1">Price</p>
                    <p className="font-mono text-text-primary font-semibold text-sm">PKR {parseFloat(coin.currentPrice).toFixed(4)}</p>
                  </div>
                  <MiniChart data={histories[coin.id] || []} isPositive={positive} />
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-text-muted">No coins match your search</div>
          )}
        </div>
      )}
    </div>
  );
}
