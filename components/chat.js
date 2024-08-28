"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./chatbot.module.css";
import { auth, db } from "../utils/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth"; // Correct import

export default function ChatBot({ location }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle authentication and redirection
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/"); // Redirect to landing page if not authenticated
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch chat history
  useEffect(() => {
    const fetchChatHistory = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const chatDoc = await getDoc(doc(db, "chats", user.uid));
          if (chatDoc.exists()) {
            setMessages(chatDoc.data().messages || []);
          }
        } catch (error) {
          console.error("Failed to fetch chat history:", error);
          if (error.code === "unavailable") {
            alert(
              "Firestore is currently unavailable. Please check your internet connection."
            );
          }
          // Implement a retry mechanism if needed
          setTimeout(fetchChatHistory, 5000); // Retry after 5 seconds
        }
      }
    };

    fetchChatHistory();
  }, []);


  // Save chat history to Firestore
  const saveChatHistory = async (updatedMessages) => {
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, "chats", user.uid), { messages: updatedMessages });
    }
  };

  // Send message and handle AI response
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);

    const userMessage = input.trim();
    setInput("");

    const updatedMessages = [
      ...messages,
      { sender: "user", text: userMessage },
      { sender: "bot", text: "" }, // Placeholder for bot response
    ];

    setMessages(updatedMessages);
    scrollToBottom();

    saveChatHistory(updatedMessages); // Save message before AI response

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
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

        const updatedMessagesWithResponse = updatedMessages.map((msg, i) =>
          i === updatedMessages.length - 1 ? { ...msg, text: botResponse } : msg
        );

        setMessages(updatedMessagesWithResponse);
        saveChatHistory(updatedMessagesWithResponse); // Save the complete AI response
      }
    } catch (error) {
      console.error("Error receiving message:", error);
      const errorMessages = [
        ...updatedMessages.slice(0, updatedMessages.length - 1),
        {
          sender: "bot",
          text: "Oops! Something went wrong. Please try again.",
        },
      ];
      setMessages(errorMessages);
      saveChatHistory(errorMessages);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat
  const clearChat = async () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear the chat?"
    );
    if (confirmClear) {
      setMessages([]);
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "chats", user.uid), { messages: [] });
      }
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await auth.signOut();
    router.replace("/");
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.topBar}>
        <div className={styles.title}>Explore-AI Chat</div>
        <div className={styles.buttonGroup}>
          <button onClick={clearChat} className={styles.clearChatButton}>
            Clear Chat
          </button>
          <button onClick={handleSignOut} className={styles.signOutButton}>
            Sign Out
          </button>
        </div>
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
