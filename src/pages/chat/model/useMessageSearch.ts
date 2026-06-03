import { useMemo } from "react";
import type { Message } from "@/entities/message/model/types";

export const useMessageSearch = (messages: Message[], searchQuery: string) => {
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredMessages = useMemo(() => {
    if (!normalizedSearchQuery) return messages;

    return messages.filter((message) => {
      const author = `${message.userName ?? ""} ${message.user ?? ""}`.toLocaleLowerCase();
      const replyText = `${message.replyTo?.text ?? ""} ${message.replyTo?.userName ?? ""} ${message.replyTo?.user ?? ""}`.toLocaleLowerCase();
      return (
        message.text.toLocaleLowerCase().includes(normalizedSearchQuery) ||
        author.includes(normalizedSearchQuery) ||
        replyText.includes(normalizedSearchQuery)
      );
    });
  }, [messages, normalizedSearchQuery]);

  return {
    normalizedSearchQuery,
    filteredMessages,
  };
};
