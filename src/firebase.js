import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAibUi3SaxXe5sczdbOxV3ZmZJnDWI4ArM",
  authDomain: "heures-delegation.firebaseapp.com",
  projectId: "heures-delegation",
  storageBucket: "heures-delegation.firebasestorage.app",
  messagingSenderId: "656323828313",
  appId: "1:656323828313:web:7df6982d981bfd992c6f48",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

export const db = getFirestore(app);
