import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';

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

  // Full-page redirect instead of a popup: no popup window and no
  // cross-window handoff, so popup blockers / extensions can't break it.
  // Sign-in completes on return via getRedirectResult + onAuthStateChanged.
  const loginWithGoogle = () => signInWithRedirect(auth, googleProvider);

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
