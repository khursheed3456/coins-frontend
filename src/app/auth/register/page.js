'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', referralCode: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      toast.success('Account created! Check your email for the OTP code.');
      router.push(`/auth/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-slide-up">
      <h2 className="font-display text-xl font-semibold text-text-primary mb-5">Create Account</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-text-secondary text-sm mb-1.5 block">Email</label>
          <input type="email" className="input" placeholder="you@example.com"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="text-text-secondary text-sm mb-1.5 block">Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} className="input pr-12" placeholder="Min. 8 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary touch-manipulation">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-text-secondary text-sm mb-1.5 block">Confirm Password</label>
          <input type="password" className="input" placeholder="Re-enter password"
            value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
        </div>
        <div>
          <label className="text-text-secondary text-sm mb-1.5 block">
            Referral Code <span className="text-text-muted">(optional)</span>
          </label>
          <input type="text" className="input font-mono tracking-widest uppercase" placeholder="XXXXXXXX"
            value={form.referralCode} onChange={e => setForm({ ...form, referralCode: e.target.value })} maxLength={12} />
        </div>
        <button type="submit" className="btn-primary flex items-center justify-center gap-2 mt-1" disabled={loading}>
          {loading ? <span className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" /> : <UserPlus size={17} />}
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
      <p className="text-text-secondary text-sm text-center mt-5">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-cyan hover:text-cyan-dim">Sign in</Link>
      </p>
    </div>
  );
}
