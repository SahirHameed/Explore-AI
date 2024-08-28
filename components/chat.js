"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./chatbot.module.css";
import { auth, db } from "../utils/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function ChatBot({ location }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const user = auth.currentUser;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (user) {
        const chatDoc = await getDoc(doc(db, "chats", user.uid));
        if (chatDoc.exists()) {
          setMessages(chatDoc.data().messages);
        }
      }
    };

    fetchChatHistory();
  }, [user]);

  const saveChatHistory = async (updatedMessages) => {
    if (user) {
      await setDoc(doc(db, "chats", user.uid), { messages: updatedMessages });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);

    const userMessage = input.trim();
    setInput("");

    // Add the user message to the messages array
    const updatedMessages = [
      ...messages,
      { sender: "user", text: userMessage },
      { sender: "bot", text: "" }, // Add an empty bot message to start the typing effect
    ];

    setMessages(updatedMessages);
    scrollToBottom();

    saveChatHistory(updatedMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages.slice(0, -1), // Send all messages except the empty bot message
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

        // Update the bot's message with the new text
        const updatedMessagesWithTyping = updatedMessages.map((msg, i) =>
          i === updatedMessages.length - 1 ? { ...msg, text: botResponse } : msg
        );

        setMessages(updatedMessagesWithTyping);
        scrollToBottom();
      }

      // Save the final bot response
      saveChatHistory(updatedMessages);
    } catch (error) {
      console.error("Error receiving message:", error);
      const errorMessages = [
        ...updatedMessages.slice(0, -1),
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



  const clearChat = async () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear the chat?"
    );
    if (confirmClear) {
      setMessages([]);
      if (user) {
        await updateDoc(doc(db, "chats", user.uid), { messages: [] });
      }
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/");
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
