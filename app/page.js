"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatBot from "../components/chat";
import LandingPage from "../components/landingpage";
import { auth } from "../utils/firebase";

export default function Page() {
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [currentPage, setCurrentPage] = useState("landing");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentPage("dashboard");
      } else {
        setCurrentPage("landing");
      }
    });

    return () => unsubscribe();
  }, []);

  if (currentPage === "landing") {
    return <LandingPage />;
  } else if (currentPage === "dashboard") {
    return <ChatBot location={location} />;
  } else {
    return <div>Page not found</div>; // Fallback if something goes wrong
  }
}
