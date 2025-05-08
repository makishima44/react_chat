import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../services/firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import s from "./chatPage.module.css";
import { Button } from "@/components/UI/button";

type Message = {
  id: string;
  text: string;
  createdAt: any;
  user: string;
};

export const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Message, "id">),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

  const handleSend = async () => {
    if (input.trim() === "") return;

    await addDoc(collection(db, "messages"), {
      text: input,
      createdAt: serverTimestamp(),
      user: auth.currentUser?.email || "Unknown",
    });

    setInput("");
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={s.chatRoot}>
      <div className={s.header}>
        <h2>Chat Room</h2>
        <Button onClick={handleLogout}>Logout</Button>
      </div>

      <div className={s.messages}>
        {messages.map((msg) => (
          <div key={msg.id} className={msg.user === auth.currentUser?.email ? s.ownMessage : s.message}>
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={s.inputArea}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a message..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};
