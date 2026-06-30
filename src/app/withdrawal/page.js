'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpCircle, CheckCircle, XCircle, Clock, Info, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import { format } from 'date-fns';

const METHODS = [
  { id: 'jazzcash',  label: 'JazzCash'  },
  { id: 'easypaisa', label: 'EasyPaisa' },
];
const TYPES = [
  { id: 'referral', label: 'Referral Earnings', note: 'Withdraw your referral bonus anytime' },
  { id: 'deposit',  label: 'Trading Balance',   note: 'Must have bought coins first' },
];

export default function WithdrawalPage() {
  const router = useRouter();
  const { user, init, isLoading, updateUser } = useAuthStore();
  const [method, setMethod] = useState('');
  const [withdrawalType, setWithdrawalType] = useState('referral');
  const [form, setForm] = useState({ receiverName: '', receiverNumber: '', amount: '' });
  const [withdrawals, setWithdrawals] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [meData, setMeData] = useState(null);

  useEffect(() => { init(); }, []);
  useEffect(() => { if (!isLoading && !user) router.push('/auth/login'); }, [user, isLoading]);

  const fetchData = async () => {
    try {
      const [wRes, meRes] = await Promise.all([api.get('/finance/withdrawals'), api.get('/auth/me')]);
      setWithdrawals(wRes.data.withdrawals);
      setMeData(meRes.data);
      updateUser(meRes.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!method) { toast.error('Select a payment method'); return; }
    if (parseFloat(form.amount) < 500) { toast.error('Minimum withdrawal is PKR 500'); return; }
    if (withdrawalType === 'referral' && parseFloat(form.amount) > parseFloat(meData?.referralEarnings || 0)) {
      toast.error('Insufficient referral earnings'); return;
    }
    setSubmitting(true);
    try {
      await api.post('/finance/withdraw', { method, withdrawalType, ...form, amount: parseFloat(form.amount) });
      toast.success('Withdrawal request submitted!');
      setForm({ receiverName: '', receiverNumber: '', amount: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (s) => s === 'approved'
    ? <CheckCircle size={14} className="text-green-profit flex-shrink-0" />
    : s === 'rejected' ? <XCircle size={14} className="text-red-loss flex-shrink-0" />
    : <Clock size={14} className="text-yellow-400 flex-shrink-0" />;

  if (isLoading || !user) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-xl md:text-2xl font-bold text-text-primary mb-1">Withdraw Funds</h1>
      <p className="text-text-secondary text-sm mb-5">Minimum: <span className="text-cyan font-mono">PKR 500</span></p>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="stat-card">
          <span className="stat-label text-xs">Referral Earnings</span>
          <span className="stat-value text-lg font-mono text-cyan">PKR {parseFloat(meData?.referralEarnings || 0).toLocaleString()}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label text-xs">Trading Balance</span>
          <span className="stat-value text-lg font-mono">PKR {parseFloat(meData?.balance || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <div className="space-y-4">
          {/* Type */}
          <div className="card">
            <p className="text-text-secondary text-sm font-medium mb-3">Withdrawal Type</p>
            <div className="flex flex-col gap-2">
              {TYPES.map(t => (
                <button key={t.id} onClick={() => setWithdrawalType(t.id)}
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all touch-manipulation
                    ${withdrawalType === t.id ? 'border-cyan/50 bg-cyan/5' : 'border-bg-border hover:border-bg-border/60'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 transition-all ${withdrawalType === t.id ? 'border-cyan bg-cyan' : 'border-text-muted'}`} />
                  <div>
                    <p className={`font-medium text-sm ${withdrawalType === t.id ? 'text-cyan' : 'text-text-secondary'}`}>{t.label}</p>
                    <p className="text-text-muted text-xs mt-0.5">{t.note}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Method */}
          <div className="card">
            <p className="text-text-secondary text-sm font-medium mb-3">Payment Method</p>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all touch-manipulation
                    ${method === m.id ? 'border-cyan/50 bg-cyan/5 text-cyan' : 'border-bg-border text-text-muted hover:border-bg-border/60'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="card space-y-4">
            <h2 className="font-display font-semibold text-text-primary text-sm md:text-base">Receiver Details</h2>
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">Receiver Name</label>
              <input type="text" className="input" placeholder="Name on account"
                value={form.receiverName} onChange={e => setForm({ ...form, receiverName: e.target.value })} required />
            </div>
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">Mobile Number</label>
              <input type="tel" className="input font-mono" placeholder="03XX-XXXXXXX"
                value={form.receiverNumber} onChange={e => setForm({ ...form, receiverNumber: e.target.value })} required />
            </div>
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">Amount (PKR)</label>
              <input type="number" className="input font-mono" placeholder="Minimum 500"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} min="500" required />
            </div>
            {withdrawalType === 'referral' && (
              <div className="flex items-start gap-2 bg-cyan/5 border border-cyan/20 rounded-lg px-4 py-3 text-xs text-cyan">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <span>Referral withdrawals are processed upon admin approval.</span>
              </div>
            )}
            <button type="submit" disabled={submitting || !method}
              className="btn-primary w-full flex items-center justify-center gap-2 touch-manipulation">
              {submitting ? <span className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" /> : <ArrowUpCircle size={17} />}
              {submitting ? 'Submitting...' : 'Submit Withdrawal'}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-text-primary text-sm md:text-base">History</h2>
            <button onClick={fetchData} className="text-text-muted hover:text-cyan transition-colors touch-manipulation p-1">
              <RefreshCw size={15} />
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" /></div>
          ) : withdrawals.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-8">No withdrawals yet</p>
          ) : (
            <div className="space-y-1">
              {withdrawals.map(w => (
                <div key={w.id} className="flex items-center gap-3 py-3 border-b border-bg-border/40 last:border-0">
                  {statusIcon(w.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-mono font-semibold">PKR {parseFloat(w.amount).toLocaleString()}</p>
                    <p className="text-text-muted text-xs truncate">{w.method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} · {w.withdrawalType}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`badge-${w.status} capitalize`}>{w.status}</span>
                    <p className="text-text-muted text-xs mt-1">{format(new Date(w.createdAt), 'dd MMM HH:mm')}</p>
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
