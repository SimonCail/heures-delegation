import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Serve the auth handler first-party (from the app's own domain) instead of
// *.firebaseapp.com. Vercel rewrites proxy /__/auth/* to Firebase, so the
// auth iframe/handler is same-origin — this avoids third-party storage being
// blocked (popup handoff broken by extensions, "missing initial state" on
// mobile/PWA, etc.). Localhost keeps the default Firebase domain.
const isLocalhost =
  typeof window !== 'undefined' &&
  /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

const firebaseConfig = {
  apiKey: "AIzaSyAibUi3SaxXe5sczdbOxV3ZmZJnDWI4ArM",
  authDomain: isLocalhost ? "heures-delegation.firebaseapp.com" : window.location.hostname,
  projectId: "heures-delegation",
  storageBucket: "heures-delegation.firebasestorage.app",
  messagingSenderId: "656323828313",
  appId: "1:656323828313:web:7df6982d981bfd992c6f48",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
