import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "../utils/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import styles from "./landingpage.module.css";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
      } else {
        setLoading(false); // Show the login/signup form
      }
    });

    return () => unsubscribe();
  }, [router]);

  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const handleAuth = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      alert("Please fill in both email and password fields.");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(
          auth,
          trimmedEmail,
          trimmedPassword
        );
        alert("Account created successfully!");
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        alert("Logged in successfully!");
      }
    } catch (error) {
      console.error("Authentication error:", error.message);
      alert("Authentication error: " + error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      alert("Logged in with Google successfully!");
    } catch (error) {
      console.error("Google sign-in error:", error.message);
      alert("Google sign-in error: " + error.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while checking auth status
  }

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
