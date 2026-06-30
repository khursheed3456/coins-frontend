'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import useAuthStore from '../../../store/authStore';
import { format } from 'date-fns';

export default function AdminDepositsPage() {
  const router = useRouter();
  const { user, init, isLoading } = useAuthStore();
  const [deposits, setDeposits] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => { init(); }, []);
  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/auth/login');
      else if (user.role !== 'admin') router.push('/dashboard');
    }
  }, [user, isLoading]);

  const fetchDeposits = useCallback(async () => {
    try {
      const { data } = await api.get(`/admin/deposits${filter ? `?status=${filter}` : ''}`);
      setDeposits(data.deposits);
      setLastUpdated(new Date());
    } catch {}
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { if (user?.role === 'admin') { setLoading(true); fetchDeposits(); } }, [user, filter, fetchDeposits]);

  // HTTP polling every 15s
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const interval = setInterval(fetchDeposits, 15000);
    return () => clearInterval(interval);
  }, [user, fetchDeposits]);

  const approve = async (id) => {
    setProcessing(p => ({ ...p, [id]: true }));
    try {
      await api.patch(`/admin/deposits/${id}/approve`);
      toast.success('Deposit approved & balance credited');
      fetchDeposits();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setProcessing(p => ({ ...p, [id]: false })); }
  };

  const reject = async (id) => {
    setProcessing(p => ({ ...p, [id]: true }));
    try {
      await api.patch(`/admin/deposits/${id}/reject`, { adminNote: '' });
      toast.success('Deposit rejected');
      fetchDeposits();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setProcessing(p => ({ ...p, [id]: false })); }
  };

  if (isLoading || !user) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-text-primary">Deposits</h1>
          <p className="text-text-secondary text-xs mt-0.5">
            Auto-refreshes every 15s {lastUpdated && `· Last: ${format(lastUpdated, 'HH:mm:ss')}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDeposits} className="p-2 text-text-muted hover:text-cyan transition-colors touch-manipulation">
            <RefreshCw size={16} />
          </button>
          <div className="flex gap-1 bg-bg-card border border-bg-border p-1 rounded-xl flex-wrap">
            {['pending', 'approved', 'rejected', ''].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all touch-manipulation ${filter === s ? 'bg-cyan text-bg-base font-semibold' : 'text-text-secondary hover:text-text-primary'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {deposits.map(d => (
                <div key={d.id} className="bg-bg-elevated border border-bg-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-text-primary">PKR {parseFloat(d.amount).toLocaleString()}</span>
                    <span className={`badge-${d.status}`}>{d.status}</span>
                  </div>
                  <p className="text-text-secondary text-xs mb-0.5">{d.user?.email}</p>
                  <p className="text-text-muted text-xs mb-1">
                    {d.method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} · {d.senderName} · {d.senderNumber}
                  </p>
                  <p className="text-text-muted text-xs mb-3">{format(new Date(d.createdAt), 'dd MMM yy HH:mm')}</p>
                  {d.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => approve(d.id)} disabled={processing[d.id]}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-green-profit/30 text-green-profit text-xs hover:bg-green-profit/10 transition-all disabled:opacity-50 touch-manipulation">
                        {processing[d.id] ? <span className="w-3 h-3 border border-green-profit/30 border-t-green-profit rounded-full animate-spin" /> : <CheckCircle size={13} />}
                        Approve
                      </button>
                      <button onClick={() => reject(d.id)} disabled={processing[d.id]}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-loss/30 text-red-loss text-xs hover:bg-red-loss/10 transition-all disabled:opacity-50 touch-manipulation">
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {deposits.length === 0 && <p className="text-text-muted text-sm text-center py-8">No deposits found</p>}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block table-wrap">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-bg-border">
                    {['User','Method','Sender','Amount','1st?','Status','Date','Actions'].map(h => (
                      <th key={h} className="text-left text-text-muted text-xs py-2 pb-3 font-normal pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deposits.map(d => (
                    <tr key={d.id} className="border-b border-bg-border/40 hover:bg-bg-elevated/20 transition-colors">
                      <td className="py-3 pr-4 text-text-secondary text-xs truncate max-w-[140px]">{d.user?.email}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-medium ${d.method === 'jazzcash' ? 'text-red-400' : 'text-green-profit'}`}>
                          {d.method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-text-primary text-xs">{d.senderName}</p>
                        <p className="text-text-muted text-xs font-mono">{d.senderNumber}</p>
                      </td>
                      <td className="py-3 pr-4 font-mono text-text-primary font-semibold text-sm">PKR {parseFloat(d.amount).toLocaleString()}</td>
                      <td className="py-3 pr-4">{d.isFirstDeposit ? <span className="badge-approved">1st</span> : <span className="text-text-muted text-xs">—</span>}</td>
                      <td className="py-3 pr-4"><span className={`badge-${d.status}`}>{d.status}</span></td>
                      <td className="py-3 pr-4 text-text-muted text-xs">{format(new Date(d.createdAt), 'dd MMM yy HH:mm')}</td>
                      <td className="py-3">
                        {d.status === 'pending' ? (
                          <div className="flex gap-1.5">
                            <button onClick={() => approve(d.id)} disabled={processing[d.id]}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-green-profit/30 text-green-profit hover:bg-green-profit/10 disabled:opacity-50 touch-manipulation">
                              {processing[d.id] ? <span className="w-3 h-3 border border-green-profit/30 border-t-green-profit rounded-full animate-spin" /> : <CheckCircle size={11} />} OK
                            </button>
                            <button onClick={() => reject(d.id)} disabled={processing[d.id]}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-red-loss/30 text-red-loss hover:bg-red-loss/10 disabled:opacity-50 touch-manipulation">
                              <XCircle size={11} /> No
                            </button>
                          </div>
                        ) : <span className="text-text-muted text-xs">{d.processedAt ? format(new Date(d.processedAt), 'dd MMM HH:mm') : '—'}</span>}
                      </td>
                    </tr>
                  ))}
                  {deposits.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-text-muted text-sm">No deposits found</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
