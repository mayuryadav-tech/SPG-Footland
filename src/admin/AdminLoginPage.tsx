import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function AdminLoginPage() {
  const { user, isAdmin, loading, authError, signInWithGoogle, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [signingIn, setSigningIn] = useState(false);

  useDocumentMeta('Admin Login — SPG Footland');

  const redirectTo = (location.state as { from?: string } | null)?.from || '/admin';

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate(redirectTo, { replace: true });
    }
  }, [loading, user, isAdmin, navigate, redirectTo]);

  const handleGoogleSignIn = async () => {
    clearAuthError();
    setSigningIn(true);
    const ok = await signInWithGoogle();
    setSigningIn(false);
    if (ok) {
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo variant="light" size="lg" />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-white p-8 shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-600">
            <ShieldCheck className="h-4 w-4" />
            <span>Authorized Store Administration</span>
          </div>

          <h1 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
            Sign in to Admin Panel
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Manage SPG Footland products, categories, carousel banners, store information, and
            customer enquiries.
          </p>

          {authError && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 leading-relaxed">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn || loading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-slate-900 px-5 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            {signingIn ? (
              <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.9 0 3.61.66 4.96 1.94l3.71-3.71C18.43 1.19 15.5 0 12 0 7.31 0 3.25 2.69 1.28 6.61l4.33 3.36C6.64 6.99 9.1 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.9c2.18-2.01 3.69-4.97 3.69-8.72z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.61 14.03a7.17 7.17 0 0 1 0-4.06L1.28 6.61a12 12 0 0 0 0 10.78l4.33-3.36z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.73-2.9c-1.07.72-2.45 1.16-4.22 1.16-2.9 0-5.36-1.95-6.39-4.62L1.28 18.09C3.25 22.01 7.31 24 12 24z"
                />
              </svg>
            )}
            <span>{signingIn ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">
            Access is restricted to verified emails registered in the Firestore{' '}
            <code className="font-mono text-slate-700">admins</code> collection.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to SPG Footland Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
