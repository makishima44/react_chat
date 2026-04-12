import { FormEvent, RefObject } from "react";
import clsx from "clsx";
import type { Message } from "@/entities/message/model/types";
import { isMessageMentioningUser, splitMessageByMentions } from "@/pages/chat/model/mentions";
import s from "../chatPage.module.css";

type ChatMessagesProps = {
  messages: Message[];
  currentUserId: string;
  currentUserEmail: string;
  currentUserName: string;
  mentionAliases: string[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  editingMessageId: string | null;
  editDraft: string;
  processingMessageId: string | null;
  onStartEdit: (message: Message) => void;
  onCancelEdit: () => void;
  onEditDraftChange: (value: string) => void;
  onSaveEdit: (event?: FormEvent) => void;
  onDeleteMessage: (message: Message) => void;
  onReplyMessage: (message: Message) => void;
};

export const ChatMessages = ({
  messages,
  currentUserId,
  currentUserEmail,
  currentUserName,
  mentionAliases,
  messagesEndRef,
  editingMessageId,
  editDraft,
  processingMessageId,
  onStartEdit,
  onCancelEdit,
  onEditDraftChange,
  onSaveEdit,
  onDeleteMessage,
  onReplyMessage,
}: ChatMessagesProps) => {
  const isOwnMessage = (msg: Message) =>
    msg.userId ? msg.userId === currentUserId : msg.user === currentUserName || (currentUserEmail && msg.user === currentUserEmail);

  return (
    <div className={s.messages} role="log" aria-live="polite">
      {messages.length === 0 && <div className={s.empty}>No transmissions yet.</div>}
      {messages.map((msg) => {
        const displayName = msg.userName || msg.user || "anonymous@node";
        const isOwn = isOwnMessage(msg);
        const isEditing = editingMessageId === msg.id;
        const isProcessing = processingMessageId === msg.id;
        const mentionChunks = splitMessageByMentions(msg.text, mentionAliases);
        const mentionsCurrentUser = isMessageMentioningUser(msg.text, mentionAliases) && !isOwn;

        return (
          <div
            key={msg.id}
            className={clsx(s.message, isOwn && s.messageOwn, isEditing && s.messageEditing, mentionsCurrentUser && s.messageMentioned)}
          >
            <div className={s.messageMeta}>
              <span className={s.prompt}>&gt;</span>
              <span className={s.user}>{displayName}</span>
              <span className={s.separator}>:</span>
            </div>

            {isEditing ? (
              <form className={s.editForm} onSubmit={onSaveEdit}>
                <input
                  type="text"
                  value={editDraft}
                  onChange={(event) => onEditDraftChange(event.target.value)}
                  maxLength={2000}
                  autoFocus
                  aria-label="Edit message"
                />
                <div className={s.messageActions}>
                  <button type="submit" disabled={isProcessing || !editDraft.trim()}>
                    Save
                  </button>
                  <button type="button" disabled={isProcessing} onClick={onCancelEdit}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                {msg.replyTo && (
                  <div className={s.replyPreview}>
                    <span className={s.replyPreviewAuthor}>{msg.replyTo.userName || msg.replyTo.user || "anonymous@node"}</span>
                    <span className={s.replyPreviewText}>{msg.replyTo.text}</span>
                  </div>
                )}
                <span className={s.text}>
                  {mentionChunks.map((chunk, index) =>
                    chunk.isMention ? (
                      <span
                        key={`${msg.id}-mention-${index}`}
                        className={clsx(s.mention, chunk.isCurrentUserMention && s.mentionCurrentUser)}
                      >
                        {chunk.text}
                      </span>
                    ) : (
                      <span key={`${msg.id}-text-${index}`}>{chunk.text}</span>
                    ),
                  )}
                </span>
                {msg.editedAt && <span className={s.editedTag}>(edited)</span>}
                <div className={s.messageActions}>
                  <button type="button" disabled={isProcessing} onClick={() => onReplyMessage(msg)}>
                    Reply
                  </button>
                  {isOwn && (
                    <>
                      <button type="button" disabled={isProcessing} onClick={() => onStartEdit(msg)}>
                        Edit
                      </button>
                      <button type="button" disabled={isProcessing} onClick={() => onDeleteMessage(msg)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
