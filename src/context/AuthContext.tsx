import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { checkIsAdminEmail } from '../services/catalogueService';

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (!firebaseUser) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      if (!firebaseUser.email || !firebaseUser.emailVerified) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const eligible = await checkIsAdminEmail(firebaseUser.email);
      setIsAdmin(eligible);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const signedInUser = result.user;

      if (!signedInUser.email || !signedInUser.emailVerified) {
        await signOut(auth);
        setAuthError('Your Google account must have a verified email address to access the admin panel.');
        return false;
      }

      const eligible = await checkIsAdminEmail(signedInUser.email);
      if (!eligible) {
        await signOut(auth);
        setAuthError(
          `Access denied for ${signedInUser.email}. Only emails authorized in the Firestore "admins" collection can enter SPG Footland Admin.`
        );
        return false;
      }

      setUser(signedInUser);
      setIsAdmin(true);
      return true;
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code: string }).code)
          : '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in window was closed before completing authentication.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Browser blocked the Google sign-in popup. Please allow popups and try again.');
      } else {
        setAuthError(error instanceof Error ? error.message : 'Google Sign-In failed.');
      }
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        authError,
        signInWithGoogle,
        logout,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
