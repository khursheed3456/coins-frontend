'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../../../lib/api';
import Link from 'next/link';

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="card text-center animate-slide-up">
        <Loader size={48} className="text-cyan mx-auto mb-4 animate-spin" />
        <p className="text-text-secondary">Verifying your email...</p>
      </div>
    }>
      <VerifyPageInner />
    </Suspense>
  );
}

function VerifyPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); return; }

    api.get(`/auth/verify?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="card text-center animate-slide-up">
      {status === 'loading' && (
        <>
          <Loader size={48} className="text-cyan mx-auto mb-4 animate-spin" />
          <p className="text-text-secondary">Verifying your email...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle size={48} className="text-green-profit mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">Email Verified!</h2>
          <p className="text-text-secondary mb-6">Your account is now active. You can sign in.</p>
          <Link href="/auth/login" className="btn-primary inline-block">Go to Login</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle size={48} className="text-red-loss mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">Verification Failed</h2>
          <p className="text-text-secondary mb-6">Link is invalid or expired.</p>
          <Link href="/auth/login" className="btn-secondary inline-block">Back to Login</Link>
        </>
      )}
    </div>
  );
}
