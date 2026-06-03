import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";

import type { Message } from "@/entities/message/model/types";
import { canManageRoom, canModerateRoom, getRoomRole, normalizeRoomMembers } from "@/entities/room/model/roles";
import { auth } from "@/shared/api/firebase/firebaseConfig";
import { TerminalFrame } from "@/shared/ui/terminal-frame/TerminalFrame";
import { Button } from "@/shared/ui/button";
import { getMentionAliases } from "@/pages/chat/model/mentions";
import { useAppPreferences } from "@/shared/model/preferences";
import { useUserSettings } from "@/pages/rooms/model/useUserSettings";
import { useMobileComposerVisibility } from "@/shared/lib/useMobileComposerVisibility";
import { useChatRoom } from "@/pages/chat/model/useChatRoom";
import { useNotificationPermission } from "@/pages/chat/model/useNotificationPermission";
import { useRoomPresence } from "@/pages/chat/model/useRoomPresence";
import { useChatMessages } from "@/pages/chat/model/useChatMessages";
import { useChatMessageActions } from "@/pages/chat/model/useChatMessageActions";
import { useRoomRoleManagement } from "@/pages/chat/model/useRoomRoleManagement";
import { useRoomMembership } from "@/pages/chat/model/useRoomMembership";
import { useMessageSearch } from "@/pages/chat/model/useMessageSearch";

import s from "./chatPage.module.css";
import { ChatHeaderControls } from "./components/ChatHeaderControls";
import { ChatInput } from "./components/ChatInput";
import { ChatMessages } from "./components/ChatMessages";
import { DeleteMessageModal } from "./components/DeleteMessageModal";
import { RoomRolesModal } from "./components/RoomRolesModal";
import { ChatSettingsModal } from "./components/ChatSettingsModal";
import { RoomRoleBar } from "./components/RoomRoleBar";
import { ChatSearchBar } from "./components/ChatSearchBar";
import { ChatPresenceBar } from "./components/ChatPresenceBar";

export const ChatPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [streamError, setStreamError] = useState("");
  const navigate = useNavigate();
  const { roomId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const authUser = auth.currentUser;
  const { t } = useAppPreferences();
  const currentUserId = authUser?.uid ?? "anonymous";
  const currentUserEmail = authUser?.email ?? "";
  const currentUserName = authUser?.displayName?.trim() || currentUserEmail || t("commonAnonymous");
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
  const { roomName, roomDetails, roomStatus } = useChatRoom(roomId, t);
  const mentionAliases = useMemo(() => getMentionAliases(currentUserName, currentUserEmail), [currentUserName, currentUserEmail]);
  const currentRoomRole = getRoomRole(roomDetails, currentUserId);
  const canManageCurrentRoom = canManageRoom(roomDetails, currentUserId);
  const canModerateCurrentRoom = canModerateRoom(roomDetails, currentUserId);
  const roomMembers = useMemo(() => (roomDetails ? normalizeRoomMembers(roomDetails) : []), [roomDetails]);
  const { composerRef, inputRef } = useMobileComposerVisibility();
  const { notificationPermission, requestNotificationPermission } = useNotificationPermission();
  const { onlineUsers, typingUsers, setTypingState, handleTypingInput } = useRoomPresence({
    roomId,
    authUser,
    roomStatus,
    currentUserName,
  });

  const isOwnMessage = useCallback(
    (message: Message) =>
      message.userId
        ? message.userId === currentUserId
        : message.user === currentUserName || Boolean(currentUserEmail && message.user === currentUserEmail),
    [currentUserEmail, currentUserId, currentUserName],
  );

  const messages = useChatMessages({
    roomId,
    roomName,
    roomStatus,
    authUser,
    mentionAliases,
    notificationPermission,
    isOwnMessage,
    onError: setStreamError,
    t,
  });
  const {
    input,
    sending,
    sendError,
    editingMessageId,
    editDraft,
    processingMessageId,
    deleteTarget,
    replyTarget,
    setInput,
    setSendError,
    setEditDraft,
    handleSend,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDeleteMessage,
    handleReplyMessage,
    handleCancelReply,
    handleCloseDeleteModal,
    handleConfirmDelete,
  } = useChatMessageActions({
    roomId,
    messages,
    currentUserId,
    currentUserEmail,
    currentUserName,
    canModerateCurrentRoom,
    isOwnMessage,
    setTypingState,
    t,
  });
  const { rolesOpen, updatingRoleUserId, openRoles, closeRoles, handleChangeRole } = useRoomRoleManagement({
    roomId,
    roomDetails,
    canManageCurrentRoom,
    onError: setSendError,
    t,
  });
  const { normalizedSearchQuery, filteredMessages } = useMessageSearch(messages, searchQuery);

  useRoomMembership({
    roomId,
    authUser,
    roomDetails,
    roomStatus,
    currentUserName,
  });

  useEffect(() => {
    if (!roomId) {
      navigate("/rooms", { replace: true });
    }
  }, [roomId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setSearchQuery("");
    setStreamError("");
  }, [roomId]);

  const handleInputChange = (value: string) => {
    setInput(value);
    handleTypingInput(value);
  };

  const handleLogout = async () => {
    await setTypingState(false);
    try {
      await signOut(auth);
      navigate("/login");
    } catch {
      setSendError(t("logoutError"));
    }
  };

  if (!roomId) {
    return null;
  }

  if (roomStatus === "missing") {
    return (
      <div className={s.page}>
        <TerminalFrame
          title={t("chatMissingTitle")}
          subtitle={t("chatMissingSubtitle")}
          headerSlot={
            <ChatHeaderControls onGoToRooms={() => navigate("/rooms")} onGoToDirectMessages={() => navigate("/dm")} onLogout={handleLogout} />
          }
          className={s.chatFrame}
        >
          <div className={s.roomState}>
            <p>{t("chatMissingBody")}</p>
            <Button type="button" onClick={() => navigate("/rooms")}>
              {t("chatBackToRooms")}
            </Button>
          </div>
        </TerminalFrame>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <TerminalFrame
        title={t("chatTitle")}
        subtitle={roomName ? t("chatSubtitleWithRoom", { name: roomName }) : t("chatSubtitleFallback")}
        headerSlot={
          <ChatHeaderControls
            onOpenSettings={openSettings}
            onGoToRooms={() => navigate("/rooms")}
            onGoToDirectMessages={() => navigate("/dm")}
            onOpenRoomRoles={canManageCurrentRoom ? openRoles : undefined}
            onLogout={handleLogout}
          />
        }
        className={s.chatFrame}
        contentClassName={s.chatFrameContent}
      >
        <RoomRoleBar currentRoomRole={currentRoomRole} canModerateCurrentRoom={canModerateCurrentRoom} />

        <ChatSearchBar
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
          canModerate={canModerateCurrentRoom}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onEditDraftChange={setEditDraft}
          onSaveEdit={handleSaveEdit}
          onDeleteMessage={handleDeleteMessage}
          onReplyMessage={handleReplyMessage}
        />

        <ChatPresenceBar
          onlineUsers={onlineUsers}
          typingUsers={typingUsers}
          notificationPermission={notificationPermission}
          onEnableNotifications={requestNotificationPermission}
        />

        <ChatInput
          input={input}
          sending={sending}
          disabled={roomStatus !== "ready"}
          replyTarget={replyTarget}
          composerRef={composerRef}
          inputRef={inputRef}
          onChange={handleInputChange}
          onCancelReply={handleCancelReply}
          onSubmit={handleSend}
        />

        {(sendError || streamError) && <div className={s.sendError}>{sendError || streamError}</div>}
      </TerminalFrame>

      {deleteTarget && (
        <DeleteMessageModal
          message={deleteTarget}
          deleting={processingMessageId === deleteTarget.id}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}

      {rolesOpen && canManageCurrentRoom && (
        <RoomRolesModal
          members={roomMembers}
          currentUserId={currentUserId}
          updatingUserId={updatingRoleUserId}
          onClose={closeRoles}
          onChangeRole={handleChangeRole}
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
