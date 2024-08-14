"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatBot from "../components/chatbot";
import LandingPage from "../components/landingpage";
import { auth } from "../utils/firebase";
import { getLocation } from "../utils/location";

export default function Page() {
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [currentPage, setCurrentPage] = useState("landing");

  useEffect(() => {
    // Check if the user is already authenticated
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is authenticated, fetch location and navigate to ChatBot
        setCurrentPage("dashboard");
        getLocation()
          .then((loc) => setLocation(loc))
          .catch((err) => console.error("Error fetching location:", err));
      } else {
        // User is not authenticated, show landing page
        setCurrentPage("landing");
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  if (currentPage === "landing") {
    return <LandingPage />;
  } else if (currentPage === "dashboard") {
    return (
      <div>
        <ChatBot location={location} />
      </div>
    );
  }

  return null;
}
