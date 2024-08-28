import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBllY-lu8xFt7qkfVUX2iJ4nCe4zDSaD9M",
  authDomain: "chat-bot-5d10c.firebaseapp.com",
  projectId: "chat-bot-5d10c",
  storageBucket: "chat-bot-5d10c.appspot.com",
  messagingSenderId: "89443938080",
  appId: "1:89443938080:web:96477f71fb00e9c9483145",
  measurementId: "G-H54QRP2FT5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();


// Initialize Firebase Analytics (optional)
const analytics = typeof window !== "undefined" && getAnalytics(app);

// Export app and analytics only if needed
export { app, analytics };
