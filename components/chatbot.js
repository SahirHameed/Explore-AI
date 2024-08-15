"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./chatbot.module.css";
import { auth } from "../utils/firebase";
import { useRouter } from "next/navigation";

export default function ChatBot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const router = useRouter();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const getLocationName = async (lat, lng) => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        if (data.results.length > 0) {
          const result = data.results[0];
          const components = result.address_components;
          const city = components.find((c) => c.types.includes("locality"));
          const state = components.find((c) =>
            c.types.includes("administrative_area_level_1")
          );
          return `${city.long_name}, ${state.short_name}`;
        }
      } catch (error) {
        console.error("Error fetching location name:", error);
        return "Unknown Location";
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(await getLocationName(latitude, longitude));
        },
        (error) => {
          console.error("Error fetching location:", error);
        }
      );
    }

    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);

    const userMessage = input.trim();
    setInput("");

    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "user", text: userMessage },
      { sender: "bot", text: "" },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          location,
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let botResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        botResponse += text;

        setMessages((prevMessages) => {
          let lastMessage = prevMessages[prevMessages.length - 1];
          let otherMessages = prevMessages.slice(0, prevMessages.length - 1);
          return [...otherMessages, { ...lastMessage, text: botResponse }];
        });
      }
    } catch (error) {
      console.error("Error receiving message:", error);
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, prevMessages.length - 1),
        {
          sender: "bot",
          text: "Oops! Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/");
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.topBar}>
        <div>Explore-AI Chat</div>
        <div className={styles.locationInfo}>
          {location ? (
            <span>Location: {location}</span>
          ) : (
            <span>Fetching location...</span>
          )}
        </div>
        <button onClick={handleSignOut} className={styles.signOutButton}>
          Sign Out
        </button>
      </div>
      <div className={styles.chatBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={
              msg.sender === "user" ? styles.userMessage : styles.botMessage
            }
          >
            {msg.text &&
              msg.text.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <input
        className={styles.input}
        type="text"
        placeholder="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
      <button className={styles.sendButton} onClick={sendMessage}>
        {isLoading ? "Sending..." : "Send"}
      </button>
    </div>
  );
}
