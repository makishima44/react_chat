import { FormEvent, Fragment, RefObject } from "react";
import clsx from "clsx";
import type { Message } from "@/entities/message/model/types";
import { isMessageMentioningUser, splitMessageByMentions, type MentionChunk } from "@/pages/chat/model/mentions";
import s from "../chatPage.module.css";
import { useAppPreferences } from "@/shared/model/preferences";

type ChatMessagesProps = {
  messages: Message[];
  searchQuery: string;
  currentUserId: string;
  currentUserEmail: string;
  currentUserName: string;
  mentionAliases: string[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  editingMessageId: string | null;
  editDraft: string;
  processingMessageId: string | null;
  canModerate: boolean;
  onStartEdit: (message: Message) => void;
  onCancelEdit: () => void;
  onEditDraftChange: (value: string) => void;
  onSaveEdit: (event?: FormEvent) => void;
  onDeleteMessage: (message: Message) => void;
  onReplyMessage: (message: Message) => void;
};

const splitTextBySearch = (text: string, searchQuery: string) => {
  if (!searchQuery) return [{ text, isMatch: false }];

  const normalizedText = text.toLocaleLowerCase();
  const normalizedQuery = searchQuery.toLocaleLowerCase();
  const segments: Array<{ text: string; isMatch: boolean }> = [];
  let searchIndex = 0;

  while (searchIndex < text.length) {
    const matchIndex = normalizedText.indexOf(normalizedQuery, searchIndex);

    if (matchIndex === -1) {
      segments.push({ text: text.slice(searchIndex), isMatch: false });
      break;
    }

    if (matchIndex > searchIndex) {
      segments.push({ text: text.slice(searchIndex, matchIndex), isMatch: false });
    }

    segments.push({ text: text.slice(matchIndex, matchIndex + searchQuery.length), isMatch: true });
    searchIndex = matchIndex + searchQuery.length;
  }

  return segments.filter((segment) => segment.text.length > 0);
};

const renderMessageText = (mentionChunks: MentionChunk[], messageId: string, searchQuery: string) =>
  mentionChunks.map((chunk, chunkIndex) => {
    const searchChunks = splitTextBySearch(chunk.text, searchQuery);

    return (
      <Fragment key={`${messageId}-chunk-${chunkIndex}`}>
        {searchChunks.map((searchChunk, searchIndex) => {
          const content = searchChunk.isMatch ? <mark className={s.searchMatch}>{searchChunk.text}</mark> : searchChunk.text;

          if (chunk.isMention) {
            return (
              <span
                key={`${messageId}-mention-${chunkIndex}-${searchIndex}`}
                className={clsx(s.mention, chunk.isCurrentUserMention && s.mentionCurrentUser)}
              >
                {content}
              </span>
            );
          }

          return <Fragment key={`${messageId}-text-${chunkIndex}-${searchIndex}`}>{content}</Fragment>;
        })}
      </Fragment>
    );
  });

const formatMessageTime = (message: Message, pendingLabel: string) => {
  if (!message.createdAt) return pendingLabel;

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(message.createdAt.toDate());
};

const formatMessageDateTime = (message: Message, pendingLabel: string) => {
  if (!message.createdAt) return pendingLabel;

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(message.createdAt.toDate());
};

export const ChatMessages = ({
  messages,
  searchQuery,
  currentUserId,
  currentUserEmail,
  currentUserName,
  mentionAliases,
  messagesEndRef,
  editingMessageId,
  editDraft,
  processingMessageId,
  canModerate,
  onStartEdit,
  onCancelEdit,
  onEditDraftChange,
  onSaveEdit,
  onDeleteMessage,
  onReplyMessage,
}: ChatMessagesProps) => {
  const { t } = useAppPreferences();

  const isOwnMessage = (msg: Message) =>
    msg.userId ? msg.userId === currentUserId : msg.user === currentUserName || (currentUserEmail && msg.user === currentUserEmail);

  return (
    <div className={s.messages} role="log" aria-live="polite">
      {messages.length === 0 && <div className={s.empty}>{searchQuery ? t("chatSearchEmpty") : t("chatNoMessages")}</div>}
      {messages.map((msg) => {
        const displayName = msg.userName || msg.user || t("commonAnonymous");
        const isOwn = isOwnMessage(msg);
        const canDeleteMessage = isOwn || canModerate;
        const isEditing = editingMessageId === msg.id;
        const isProcessing = processingMessageId === msg.id;
        const mentionChunks = splitMessageByMentions(msg.text, mentionAliases);
        const mentionsCurrentUser = isMessageMentioningUser(msg.text, mentionAliases) && !isOwn;
        const messageTime = formatMessageTime(msg, t("chatTimePending"));
        const messageDateTime = formatMessageDateTime(msg, t("chatTimePending"));

        return (
          <div
            key={msg.id}
            className={clsx(s.message, isOwn && s.messageOwn, isEditing && s.messageEditing, mentionsCurrentUser && s.messageMentioned)}
          >
            <div className={s.messageMeta}>
              <span className={s.prompt}>&gt;</span>
              <span className={s.user}>{displayName}</span>
              <span className={s.separator}>:</span>
              <time className={s.messageTime} title={messageDateTime}>
                {messageTime}
              </time>
            </div>

            {isEditing ? (
              <form className={s.editForm} onSubmit={onSaveEdit}>
                <input
                  type="text"
                  value={editDraft}
                  onChange={(event) => onEditDraftChange(event.target.value)}
                  maxLength={2000}
                  autoFocus
                  aria-label={t("chatEditAria")}
                />
                <div className={s.messageActions}>
                  <button type="submit" disabled={isProcessing || !editDraft.trim()}>
                    {t("chatEditSave")}
                  </button>
                  <button type="button" disabled={isProcessing} onClick={onCancelEdit}>
                    {t("commonCancel")}
                  </button>
                </div>
              </form>
            ) : (
              <>
                {msg.replyTo && (
                  <div className={s.replyPreview}>
                    <span className={s.replyPreviewAuthor}>{msg.replyTo.userName || msg.replyTo.user || t("commonAnonymous")}</span>
                    <span className={s.replyPreviewText}>{msg.replyTo.text}</span>
                  </div>
                )}
                <span className={s.text}>
                  {renderMessageText(mentionChunks, msg.id, searchQuery)}
                </span>
                {msg.editedAt && <span className={s.editedTag}>{t("chatEdited")}</span>}
                <div className={s.messageActions}>
                  <button type="button" disabled={isProcessing} onClick={() => onReplyMessage(msg)}>
                    {t("chatReply")}
                  </button>
                  {(isOwn || canModerate) && (
                    <>
                      {isOwn && (
                        <button type="button" disabled={isProcessing} onClick={() => onStartEdit(msg)}>
                          {t("chatEdit")}
                        </button>
                      )}
                      <button type="button" disabled={isProcessing} onClick={() => onDeleteMessage(msg)}>
                        {canDeleteMessage && !isOwn ? t("chatModerateDelete") : t("commonDelete")}
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
