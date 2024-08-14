import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

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

// Initialize Firebase Analytics (optional, remove if not used)
const analytics = typeof window !== "undefined" && getAnalytics(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Set up Google auth provider
export const googleProvider = new GoogleAuthProvider();

// Optionally export the app and analytics if needed elsewhere
export { app, analytics };
