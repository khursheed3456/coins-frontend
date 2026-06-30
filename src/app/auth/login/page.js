'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import useAuthStore from '../../../store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.token, data.user);
      toast.success('Welcome back!');
      router.push(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const e = err.response?.data;
      if (e?.needsVerification) {
        toast.error('Please verify your email first');
        router.push(`/auth/verify-otp?email=${encodeURIComponent(form.email)}`);
      } else {
        toast.error(e?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-slide-up">
      <h2 className="font-display text-xl font-semibold text-text-primary mb-5">Sign In</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-text-secondary text-sm mb-1.5 block">Email</label>
          <input type="email" className="input" placeholder="you@example.com"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="text-text-secondary text-sm mb-1.5 block">Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} className="input pr-12"
              placeholder="••••••••" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary touch-manipulation">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-cyan text-xs hover:text-cyan-dim">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn-primary flex items-center justify-center gap-2" disabled={loading}>
          {loading ? <span className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" /> : <LogIn size={17} />}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p className="text-text-secondary text-sm text-center mt-5">
        No account?{' '}
        <Link href="/auth/register" className="text-cyan hover:text-cyan-dim transition-colors">Create one</Link>
      </p>
    </div>
  );
}
