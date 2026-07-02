'use client';
import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}

function ResetPasswordPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';
  const [step, setStep] = useState('otp'); // otp | password
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const handleOTPChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
    if (val && i === 5 && next.every(d => d)) verifyOTP(next.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) { setOtp(paste.split('')); verifyOTP(paste); }
  };

  const verifyOTP = async (code) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-reset-otp', { email, otp: code });
      setResetToken(data.resetToken);
      setStep('password');
      toast.success('OTP verified! Set your new password.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, resetToken, newPassword });
      toast.success('Password reset! You can now log in.');
      router.push('/auth/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-slide-up">
      <div className="w-14 h-14 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center mx-auto mb-4">
        <KeyRound size={28} className="text-cyan" />
      </div>
      <h2 className="font-display text-xl font-semibold text-text-primary text-center mb-1">
        {step === 'otp' ? 'Enter Reset Code' : 'New Password'}
      </h2>
      <p className="text-text-secondary text-sm text-center mb-6">
        {step === 'otp' ? `Code sent to ${email}` : 'Choose a strong password'}
      </p>

      {step === 'otp' ? (
        <div>
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="text" inputMode="numeric" maxLength={1}
                value={digit}
                onChange={e => handleOTPChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-11 h-13 text-center text-xl font-mono font-bold rounded-xl border-2 bg-bg-elevated transition-all outline-none
                  ${digit ? 'border-cyan text-cyan' : 'border-bg-border text-text-primary'}
                  focus:border-cyan focus:ring-2 focus:ring-cyan/20`}
                style={{ height: '52px' }}
                autoFocus={i === 0}
              />
            ))}
          </div>
          {loading && (
            <div className="flex justify-center">
              <span className="w-5 h-5 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">New Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} className="input pr-12" placeholder="Min. 8 characters"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoFocus />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary touch-manipulation">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">Confirm Password</label>
            <input type="password" className="input" placeholder="Re-enter password"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary flex items-center justify-center gap-2" disabled={loading}>
            {loading && <span className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />}
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
}
