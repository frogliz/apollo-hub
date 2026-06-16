// Firebase configuration for Apollo Hub
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAfZrTPszsXuI0YfhqE1MxyZ6aTKL8yarI",
  authDomain: "apollogs-a2a98.firebaseapp.com",
  databaseURL: "https://apollogs-a2a98-default-rtdb.firebaseio.com",
  projectId: "apollogs-a2a98",
  storageBucket: "apollogs-a2a98.firebasestorage.app",
  messagingSenderId: "52329292068",
  appId: "1:52329292068:web:f7cc73adf2b1baf88dd3b1",
  measurementId: "G-SKHG8MVLR3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export default app;
