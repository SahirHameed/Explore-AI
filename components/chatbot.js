import React, { useState, useEffect } from "react";
import styles from "./chatbot.module.css";
import { auth } from "../utils/firebase";
import { useRouter } from "next/navigation";

export default function ChatBot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => {
    // Load messages from localStorage
    const savedMessages = localStorage.getItem("chatMessages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [isLoading, setIsLoading] = useState(false); // Add a loading state for feedback
  const [location, setLocation] = useState(null); // State to store user location
  const router = useRouter();

  useEffect(() => {
    // Get the user's location when the chat starts
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error fetching location:", error);
        }
      );
    }

    // Save messages to localStorage whenever they change
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!input) return;

    const userMessage = input; // Store the user's message
    setInput(""); // Clear the input field immediately

    // Add user's message to the chat and create a placeholder for the assistant's response
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "user", text: userMessage }, // Change "role" to "sender" for consistency
      { sender: "bot", text: "" }, // Placeholder for the assistant's response
    ]);

    try {
      // Send the message to your API or OpenAI endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ...messages,
          { sender: "user", content: userMessage }, // Use "sender" consistently
        ]),
      });

      // Read the response stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let botResponse = "";
      const processText = async ({ done, value }) => {
        if (done) return botResponse;

        // Decode the streamed chunk of data
        const text = decoder.decode(value || new Uint8Array(), {
          stream: true,
        });
        botResponse += text;

        // Update the assistant's response as it streams in
        setMessages((prevMessages) => {
          let lastMessage = prevMessages[prevMessages.length - 1]; // Get the last message (assistant's placeholder)
          let otherMessages = prevMessages.slice(0, prevMessages.length - 1); // Get all previous messages
          return [
            ...otherMessages,
            { ...lastMessage, text: botResponse }, // Append the streamed text to the assistant's message
          ];
        });

        return reader.read().then(processText);
      };

      await reader.read().then(processText);
    } catch (error) {
      console.error("Error receiving message:", error);
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, prevMessages.length - 1), // Remove the placeholder
        {
          sender: "bot",
          text: "Oops! Something went wrong. Please try again.",
        },
      ]);
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
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className={styles.botMessage}>Explore-AI is typing...</div>
        )}
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
        Send
      </button>
    </div>
  );
}
