'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

export default function VerifyOTPPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef([]);

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
    // Auto-submit when all filled
    if (val && i === 5 && next.every(d => d !== '')) {
      submitOTP(next.join(''));
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      inputs.current[5]?.focus();
      submitOTP(paste);
    }
  };

  const submitOTP = async (code) => {
    if (!code || code.length !== 6) return;
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp: code });
      toast.success('Email verified! You can now log in.');
      router.push('/auth/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitOTP(otp.join(''));
  };

  const resend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('New OTP sent to your email');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="card animate-slide-up text-center">
      <div className="w-14 h-14 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center mx-auto mb-4">
        <ShieldCheck size={28} className="text-cyan" />
      </div>
      <h2 className="font-display text-xl font-semibold text-text-primary mb-1">Verify Your Email</h2>
      <p className="text-text-secondary text-sm mb-1">We sent a 6-digit code to</p>
      <p className="text-cyan font-medium text-sm mb-6 break-all">{email}</p>

      <form onSubmit={handleSubmit}>
        {/* OTP Boxes */}
        <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => inputs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-11 h-13 md:w-12 md:h-14 text-center text-xl font-mono font-bold rounded-xl border-2 bg-bg-elevated transition-all outline-none
                ${digit ? 'border-cyan text-cyan' : 'border-bg-border text-text-primary'}
                focus:border-cyan focus:ring-2 focus:ring-cyan/20`}
              style={{ height: '52px' }}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || otp.some(d => !d)}
          className="btn-primary w-full flex items-center justify-center gap-2 mb-4"
        >
          {loading && <span className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />}
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-text-muted">Didn't receive it?</span>
        {countdown > 0 ? (
          <span className="text-text-secondary font-mono">{countdown}s</span>
        ) : (
          <button
            onClick={resend}
            disabled={resending}
            className="text-cyan hover:text-cyan-dim flex items-center gap-1 transition-colors touch-manipulation"
          >
            {resending ? <span className="w-3 h-3 border border-cyan/30 border-t-cyan rounded-full animate-spin" /> : <RefreshCw size={13} />}
            Resend OTP
          </button>
        )}
      </div>
    </div>
  );
}
