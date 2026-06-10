import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";

import { auth } from "@/shared/api/firebase/firebaseConfig";
import { Button } from "@/shared/ui/button";
import { TerminalFrame } from "@/shared/ui/terminal-frame/TerminalFrame";
import { ChatHeaderControls } from "@/pages/chat/ui/components/ChatHeaderControls";
import { ChatInput } from "@/pages/chat/ui/components/ChatInput";
import { ChatMessages } from "@/pages/chat/ui/components/ChatMessages";
import { ChatSettingsModal } from "@/pages/chat/ui/components/ChatSettingsModal";
import { DeleteMessageModal } from "@/pages/chat/ui/components/DeleteMessageModal";
import { useUserSettings } from "@/pages/rooms/model/useUserSettings";
import { useAppPreferences } from "@/shared/model/preferences";
import { useMobileComposerVisibility } from "@/shared/lib/useMobileComposerVisibility";
import { useDirectChatConversation } from "../model/useDirectChatConversation";
import { DirectChatSearchBar } from "./components/DirectChatSearchBar";

import s from "./directChatPage.module.css";

export const DirectChatPage = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const authUser = auth.currentUser;
  const { t } = useAppPreferences();
  const currentUserId = authUser?.uid ?? "anonymous";
  const currentUserEmail = authUser?.email ?? "";
  const currentUserName = authUser?.displayName?.trim() || currentUserEmail || t("commonAnonymous");
  const {
    chatStatus,
    peer,
    mentionAliases,
    filteredMessages,
    normalizedSearchQuery,
    messagesEndRef,
    searchQuery,
    setSearchQuery,
    input,
    sending,
    sendError,
    setSendError,
    editingMessageId,
    editDraft,
    processingMessageId,
    deleteTarget,
    replyTarget,
    setInput,
    setEditDraft,
    setReplyTarget,
    setDeleteTarget,
    handleSend,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDeleteMessage,
    handleConfirmDelete,
  } = useDirectChatConversation({
    chatId,
    currentUserId,
    currentUserEmail,
    currentUserName,
  });
  const {
    nickname,
    nicknameError,
    savingNickname,
    settingsOpen,
    openSettings,
    closeSettings,
    handleNicknameChange,
    handleNicknameSave,
  } = useUserSettings(authUser);
  const { composerRef, inputRef } = useMobileComposerVisibility();

  useEffect(() => {
    if (!chatId) {
      navigate("/dm", { replace: true });
    }
  }, [chatId, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch {
      setSendError(t("logoutError"));
    }
  };

  if (!chatId) {
    return null;
  }

  if (chatStatus === "missing") {
    return (
      <div className={s.page}>
        <TerminalFrame
          title={t("directChatMissingTitle")}
          subtitle={t("directChatMissingSubtitle")}
          headerSlot={
            <ChatHeaderControls
              onGoToRooms={() => navigate("/rooms")}
              onGoToDirectMessages={() => navigate("/dm")}
              onLogout={handleLogout}
            />
          }
          className={s.directChatFrame}
        >
          <div className={s.roomState}>
            <p>{t("directChatMissingBody")}</p>
            <Button type="button" onClick={() => navigate("/dm")}>
              {t("directChatBack")}
            </Button>
          </div>
        </TerminalFrame>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <TerminalFrame
        title={t("directChatTitle")}
        subtitle={peer ? t("directChatSubtitleWithUser", { name: peer.displayName || peer.email }) : t("directChatSubtitleFallback")}
        headerSlot={
          <ChatHeaderControls
            onOpenSettings={openSettings}
            onGoToRooms={() => navigate("/rooms")}
            onGoToDirectMessages={() => navigate("/dm")}
            onLogout={handleLogout}
          />
        }
        className={s.directChatFrame}
        contentClassName={s.directChatFrameContent}
      >
        <div className={s.peerBar}>
          <span className={s.peerLabel}>{t("directChatPeerLabel")}:</span>
          <span className={s.peerName}>{peer?.displayName || peer?.email || t("commonAnonymous")}</span>
          {peer?.email && <span className={s.peerEmail}>{peer.email}</span>}
        </div>

        <DirectChatSearchBar
          searchQuery={searchQuery}
          resultCount={filteredMessages.length}
          hasActiveSearch={Boolean(normalizedSearchQuery)}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />

        <ChatMessages
          messages={filteredMessages}
          searchQuery={normalizedSearchQuery}
          currentUserId={currentUserId}
          currentUserEmail={currentUserEmail}
          currentUserName={currentUserName}
          mentionAliases={mentionAliases}
          messagesEndRef={messagesEndRef}
          editingMessageId={editingMessageId}
          editDraft={editDraft}
          processingMessageId={processingMessageId}
          canModerate={false}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onEditDraftChange={setEditDraft}
          onSaveEdit={handleSaveEdit}
          onDeleteMessage={handleDeleteMessage}
          onReplyMessage={setReplyTarget}
        />

        <ChatInput
          input={input}
          sending={sending}
          disabled={chatStatus !== "ready"}
          replyTarget={replyTarget}
          composerRef={composerRef}
          inputRef={inputRef}
          onChange={setInput}
          onCancelReply={() => setReplyTarget(null)}
          onSubmit={handleSend}
        />

        {sendError && <div className={s.sendError}>{sendError}</div>}
      </TerminalFrame>

      {deleteTarget && (
        <DeleteMessageModal
          message={deleteTarget}
          deleting={processingMessageId === deleteTarget.id}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {settingsOpen && (
        <ChatSettingsModal
          authUser={authUser}
          nickname={nickname}
          nicknameError={nicknameError}
          savingNickname={savingNickname}
          currentUserName={currentUserName}
          onClose={closeSettings}
          onSubmit={handleNicknameSave}
          onNicknameChange={handleNicknameChange}
        />
      )}
    </div>
  );
};
