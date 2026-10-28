import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";

import type { OnlineUser } from "@/pages/chat/model/types";
import type { Room } from "@/entities/room/model/types";
import { auth } from "@/shared/api/firebase/firebaseConfig";
import { Button } from "@/shared/ui/button";
import { TerminalFrame } from "@/shared/ui/terminal-frame/TerminalFrame";
import { ChatWorkspace } from "@/pages/chat/ui/components/ChatWorkspace";
import { ChatHeaderControls } from "@/pages/chat/ui/components/ChatHeaderControls";
import { ChatInput } from "@/pages/chat/ui/components/ChatInput";
import { ChatMessages } from "@/pages/chat/ui/components/ChatMessages";
import { ChatSettingsModal } from "@/pages/chat/ui/components/ChatSettingsModal";
import { DeleteMessageModal } from "@/pages/chat/ui/components/DeleteMessageModal";
import { useUserSettings } from "@/pages/rooms/model/useUserSettings";
import { useAppPreferences } from "@/shared/model/preferences";
import { useMobileComposerVisibility } from "@/shared/lib/useMobileComposerVisibility";
import { useRoomsQuery } from "@/pages/rooms/model/useRoomsQuery";
import { useDirectChatsQuery } from "@/pages/direct-messages/model/useDirectChatsQuery";
import { useRoomAccess } from "@/pages/rooms/model/useRoomAccess";
import { AccessRoomModal } from "@/pages/rooms/ui/components/AccessRoomModal";
import { useDirectChatConversation } from "../model/useDirectChatConversation";
import { DirectChatSearchBar } from "./components/DirectChatSearchBar";

import s from "./directChatPage.module.css";
import chatS from "@/pages/chat/ui/chatPage.module.css";

const noOnlineUsers: OnlineUser[] = [];

export const DirectChatPage = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const authUser = auth.currentUser;
  const { t } = useAppPreferences();
  const currentUserId = authUser?.uid ?? "anonymous";
  const currentUserEmail = authUser?.email ?? "";
  const currentUserName = authUser?.displayName?.trim() || currentUserEmail || t("commonAnonymous");
  const {
    nickname,
    avatarId,
    nicknameError,
    savingNickname,
    settingsOpen,
    openSettings,
    closeSettings,
    handleNicknameChange,
    handleAvatarChange,
    handleNicknameSave,
  } = useUserSettings(authUser);
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
    currentUserAvatar: avatarId,
  });
  const { composerRef, inputRef } = useMobileComposerVisibility();
  const { rooms } = useRoomsQuery(currentUserId, { trackUnreadCounts: false });
  const { directChats } = useDirectChatsQuery(currentUserId);
  const roomAccess = useRoomAccess({ navigate, currentUserId, currentUserName });

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
    <div className={`${s.page} ${chatS.roomPage} ${s.directConversation}`}>
      <ChatWorkspace
        roomId=""
        roomName=""
        rooms={rooms}
        directChats={directChats}
        onlineUsers={noOnlineUsers}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={avatarId}
        conversationType="direct"
        directChatId={chatId}
        peerName={peer?.displayName || peer?.email || t("commonAnonymous")}
        peerId={peer?.userId}
        peerAvatarId={peer?.avatarId}
        headerControls={
          <ChatHeaderControls
            onOpenSettings={openSettings}
            onGoToRooms={() => navigate("/rooms")}
            onGoToDirectMessages={() => navigate("/dm")}
            onLogout={handleLogout}
            workspace
          />
        }
        onOpenRoom={(room: Room) => roomAccess.handleOpenRoom(room.id, room)}
        onNavigate={navigate}
        onOpenSettings={openSettings}
      >
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
          currentUserAvatar={avatarId}
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
      </ChatWorkspace>

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
          avatarId={avatarId}
          nicknameError={nicknameError}
          savingNickname={savingNickname}
          currentUserName={currentUserName}
          onClose={closeSettings}
          onSubmit={handleNicknameSave}
          onNicknameChange={handleNicknameChange}
          onAvatarChange={handleAvatarChange}
        />
      )}
      {roomAccess.accessTarget && (
        <AccessRoomModal
          accessTarget={roomAccess.accessTarget}
          accessPassword={roomAccess.accessPassword}
          accessError={roomAccess.accessError}
          onPasswordChange={roomAccess.handleAccessPasswordChange}
          onClose={roomAccess.handleCloseAccessModal}
          onConfirm={roomAccess.handleConfirmAccess}
        />
      )}
    </div>
  );
};
