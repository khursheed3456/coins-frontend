'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset code sent if email exists');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="card animate-slide-up text-center">
        <div className="w-14 h-14 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center mx-auto mb-4">
          <Mail size={28} className="text-cyan" />
        </div>
        <h2 className="font-display text-xl font-semibold text-text-primary mb-2">Check Your Email</h2>
        <p className="text-text-secondary text-sm mb-6">
          We sent a 6-digit reset code to <span className="text-cyan">{email}</span>
        </p>
        <button
          onClick={() => router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)}
          className="btn-primary w-full mb-3"
        >
          Enter Reset Code
        </button>
        <button onClick={() => setSent(false)} className="text-text-muted text-sm hover:text-text-secondary">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="card animate-slide-up">
      <Link href="/auth/login" className="flex items-center gap-2 text-text-muted hover:text-cyan text-sm mb-5 transition-colors w-fit touch-manipulation">
        <ArrowLeft size={15} /> Back to login
      </Link>
      <h2 className="font-display text-xl font-semibold text-text-primary mb-2">Forgot Password</h2>
      <p className="text-text-secondary text-sm mb-5">Enter your email and we'll send you a reset code.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-text-secondary text-sm mb-1.5 block">Email Address</label>
          <input type="email" className="input" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        </div>
        <button type="submit" className="btn-primary flex items-center justify-center gap-2" disabled={loading}>
          {loading && <span className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />}
          {loading ? 'Sending...' : 'Send Reset Code'}
        </button>
      </form>
    </div>
  );
}
