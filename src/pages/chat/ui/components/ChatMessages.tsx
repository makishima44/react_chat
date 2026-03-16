import { RefObject } from "react";
import clsx from "clsx";
import type { Message } from "@/entities/message/model/types";
import s from "../chatPage.module.css";

type ChatMessagesProps = {
  messages: Message[];
  currentUserId: string;
  currentUserEmail: string;
  currentUserName: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};

export const ChatMessages = ({ messages, currentUserId, currentUserEmail, currentUserName, messagesEndRef }: ChatMessagesProps) => {
  return (
    <div className={s.messages} role="log" aria-live="polite">
      {messages.length === 0 && <div className={s.empty}>No transmissions yet.</div>}
      {messages.map((msg) => {
        const displayName = msg.userName || msg.user || "anonymous@node";
        const isOwn = msg.userId ? msg.userId === currentUserId : msg.user === currentUserName || (currentUserEmail && msg.user === currentUserEmail);

        return (
          <div key={msg.id} className={clsx(s.message, isOwn && s.messageOwn)}>
            <span className={s.prompt}>&gt;</span>
            <span className={s.user}>{displayName}</span>
            <span className={s.separator}>:</span>
            <span className={s.text}>{msg.text}</span>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
