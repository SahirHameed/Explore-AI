import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "../utils/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import styles from "./landingpage.module.css";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome to Eventure</h1>
      <input
        type="email"
        className={styles.input}
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className={styles.input}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleAuth} className={styles.button}>
        {isSignUp ? "Sign Up" : "Log In"}
      </button>
      <button onClick={handleGoogleSignIn} className={styles.button}>
        Sign in with Google
      </button>
      <p className={styles.toggleText} onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? "Already have an account? Log In" : "New here? Sign Up"}
      </p>
    </div>
  );
}
