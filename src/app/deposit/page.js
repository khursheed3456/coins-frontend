'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownCircle, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import { format } from 'date-fns';

const METHODS = [
  { id: 'jazzcash',  label: 'JazzCash',  activeClass: 'border-red-400/60 bg-red-400/10 text-red-400' },
  { id: 'easypaisa', label: 'EasyPaisa', activeClass: 'border-green-profit/60 bg-green-profit/10 text-green-profit' },
];

export default function DepositPage() {
  const router = useRouter();
  const { user, init, isLoading } = useAuthStore();
  const [method, setMethod] = useState('');
  const [form, setForm] = useState({ senderName: '', senderNumber: '', amount: '' });
  const [deposits, setDeposits] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { init(); }, []);
  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading]);

  const fetchDeposits = () => {
    api.get('/finance/deposits').then(({ data }) => setDeposits(data.deposits)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { if (user) fetchDeposits(); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!method) { toast.error('Select a payment method'); return; }
    if (parseFloat(form.amount) < 1000) { toast.error('Minimum deposit is PKR 1,000'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post('/finance/deposit', { method, ...form, amount: parseFloat(form.amount) });
      toast.success('Deposit request submitted! Admin will verify shortly.');
      setDeposits(prev => [data.deposit, ...prev]);
      setForm({ senderName: '', senderNumber: '', amount: '' });
      setMethod('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (s) => s === 'approved' ? <CheckCircle size={14} className="text-green-profit flex-shrink-0" />
    : s === 'rejected' ? <XCircle size={14} className="text-red-loss flex-shrink-0" />
    : <Clock size={14} className="text-yellow-400 flex-shrink-0" />;

  if (isLoading || !user) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-xl md:text-2xl font-bold text-text-primary mb-1">Deposit Funds</h1>
      <p className="text-text-secondary text-sm mb-6">Minimum: <span className="text-cyan font-mono">PKR 1,000</span></p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <div className="space-y-4">
          {/* Method */}
          <div className="card">
            <p className="text-text-secondary text-sm font-medium mb-3">Payment Method</p>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`py-3.5 px-4 rounded-xl border-2 font-semibold text-sm transition-all touch-manipulation
                    ${method === m.id ? m.activeClass : 'border-bg-border text-text-muted hover:border-bg-border/80'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <form onSubmit={handleSubmit} className="card space-y-4">
            <h2 className="font-display font-semibold text-text-primary text-sm md:text-base">Transfer Details</h2>
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">Sender Name</label>
              <input type="text" className="input" placeholder="Name on your account"
                value={form.senderName} onChange={e => setForm({ ...form, senderName: e.target.value })} required />
            </div>
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">Mobile Number</label>
              <input type="tel" className="input font-mono" placeholder="03XX-XXXXXXX"
                value={form.senderNumber} onChange={e => setForm({ ...form, senderNumber: e.target.value })} required />
            </div>
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">Amount (PKR)</label>
              <input type="number" className="input font-mono" placeholder="Minimum 1,000"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} min="1000" required />
            </div>
            <div className="bg-bg-elevated border border-bg-border rounded-lg px-4 py-3 text-xs text-text-muted leading-relaxed">
              📌 Send payment to admin's {method ? METHODS.find(m => m.id === method)?.label : '...'} number first, then submit this form.
            </div>
            <button type="submit" disabled={submitting || !method}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {submitting ? <span className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" /> : <ArrowDownCircle size={17} />}
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-text-primary text-sm md:text-base">History</h2>
            <button onClick={fetchDeposits} className="text-text-muted hover:text-cyan transition-colors touch-manipulation p-1">
              <RefreshCw size={15} />
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>
          ) : deposits.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-8">No deposits yet</p>
          ) : (
            <div className="space-y-1">
              {deposits.map(d => (
                <div key={d.id} className="flex items-center gap-3 py-3 border-b border-bg-border/40 last:border-0">
                  {statusIcon(d.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-mono font-semibold">PKR {parseFloat(d.amount).toLocaleString()}</p>
                    <p className="text-text-muted text-xs truncate">{d.method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} · {d.senderName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`badge-${d.status} capitalize`}>{d.status}</span>
                    <p className="text-text-muted text-xs mt-1">{format(new Date(d.createdAt), 'dd MMM HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
