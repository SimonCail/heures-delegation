import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';

// Popup failures that mean "the popup couldn't open" (blocker / extension /
// unsupported env) — in those cases we fall back to a full-page redirect.
const POPUP_FALLBACK_CODES = [
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/internal-error',
  'auth/network-request-failed',
];

const AuthContext = createContext(null);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Complete a redirect-based Google sign-in if we're coming back from one.
    getRedirectResult(auth).catch(() => {});
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      // If login fails, check if this email uses Google instead
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.includes('google.com') && !methods.includes('password')) {
          throw { code: 'auth/google-account-exists' };
        }
      }
      throw err;
    }
  };

  const signup = async (email, password) => {
    // Check if this email is already used by Google
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.includes('google.com') && !methods.includes('password')) {
      throw { code: 'auth/google-account-exists' };
    }
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (err) {
      // If the popup couldn't open (blocker / extension / unsupported),
      // retry with a full-page redirect, which can't be popup-blocked.
      if (POPUP_FALLBACK_CODES.includes(err?.code)) {
        await signInWithRedirect(auth, googleProvider);
        return; // the page navigates away; sign-in completes on return
      }
      throw err;
    }
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
