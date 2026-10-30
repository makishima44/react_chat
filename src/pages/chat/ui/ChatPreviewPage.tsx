import { FormEvent, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import type { Message } from "@/entities/message/model/types";
import type { DirectChat } from "@/entities/direct-chat/model/types";
import type { Room } from "@/entities/room/model/types";
import type { AvatarId } from "@/entities/user/model/avatarOptions";
import type { OnlineUser } from "@/pages/chat/model/types";
import { DEFAULT_AVATAR_ID } from "@/entities/user/model/avatarOptions";
import { ChatHeaderControls } from "./components/ChatHeaderControls";
import { ChatInput } from "./components/ChatInput";
import { ChatMessages } from "./components/ChatMessages";
import { ChatPresenceBar } from "./components/ChatPresenceBar";
import { ChatSearchBar } from "./components/ChatSearchBar";
import { ChatSettingsModal } from "./components/ChatSettingsModal";
import { ChatWorkspace } from "./components/ChatWorkspace";
import { RoomRoleBar } from "./components/RoomRoleBar";
import { getMentionAliases } from "@/pages/chat/model/mentions";
import type { NotificationPermissionState } from "@/pages/chat/model/types";
import s from "./chatPage.module.css";

const previewRooms: Room[] = ["general", "dev", "design", "music", "off-topic"].map((name, index) => ({
  id: `room-${index + 1}`,
  name,
  createdAt: null,
}));

const previewMembers: OnlineUser[] = [
  { id: "member-nova", userId: "preview", userName: "Nova" },
  { id: "member-cipher", userId: "cipher", userName: "Cipher" },
  { id: "member-lumen", userId: "lumen", userName: "Lumen" },
  { id: "member-mira", userId: "mira", userName: "Mira", isTyping: true },
  { id: "member-kade", userId: "kade", userName: "Kade" },
];

const previewChats: DirectChat[] = ["Cipher", "Mira", "Lumen"].map((name) => ({
  id: `dm-${name.toLowerCase()}`,
  memberIds: ["preview", name.toLowerCase()],
  memberProfiles: {
    [name.toLowerCase()]: { userId: name.toLowerCase(), displayName: name, email: `${name.toLowerCase()}@node.net` },
  },
}));

const createMessage = (id: string, userName: string, userId: string, text: string, minute: number, replyTo?: Message["replyTo"]): Message => ({
  id,
  user: userName,
  userName,
  userId,
  text,
  createdAt: Timestamp.fromDate(new Date(2026, 9, 27, 22, minute)),
  replyTo,
});

const previewMessages: Message[] = [
  createMessage("m1", "Nova", "nova", "Finally got the auth flow cleaned up. The access node screen looks so good now.", 14),
  createMessage("m2", "Cipher", "cipher", "Agreed. That terminal vibe hits different. The little details make it feel alive.", 16),
  createMessage("m3", "Nova", "preview", "Pushed a few more tweaks to the chat UI tonight. Let me know what you think!", 18),
  createMessage("m4", "Kade", "kade", "This is looking great. Really love the direction. Feels modern but still has that old school soul.", 20),
  createMessage("m5", "Mira", "mira", "Same. The color system is 🔥 Makes late night coding a lot more fun.", 21),
  createMessage(
    "m6",
    "Lumen",
    "lumen",
    "Looks super clean! The message flow feels really nice. Should we ship a beta this weekend?",
    23,
    { id: "m3", text: "Pushed a few more tweaks to the chat UI tonight.", userName: "Nova", user: "Nova" },
  ),
  createMessage("m7", "Nova", "preview", "Let's do it. I'll polish a few things tonight and circle back tomorrow.", 25),
];

const previewUser = {
  uid: "preview",
  email: "nova@node.net",
  displayName: "Nova",
} as User;

export const ChatPreviewPage = () => {
  const [selectedRoom, setSelectedRoom] = useState(previewRooms[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState(previewMessages);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nickname, setNickname] = useState("Nova");
  const [avatarId, setAvatarId] = useState<AvatarId>(DEFAULT_AVATAR_ID);
  const messagesEndRef = useMemo(() => ({ current: null }), []);
  const mentionAliases = useMemo(() => getMentionAliases(nickname, previewUser.email ?? ""), [nickname]);
  const filteredMessages = useMemo(
    () => messages.filter((message) => message.text.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase())),
    [messages, searchQuery],
  );

  const handleSend = (event?: FormEvent) => {
    event?.preventDefault();
    const text = messageText.trim();
    if (!text) return;
    setMessages((current) => [...current, createMessage(`m${current.length + 1}`, nickname, previewUser.uid, text, 26, replyTarget ? {
      id: replyTarget.id,
      text: replyTarget.text,
      user: replyTarget.user,
      userName: replyTarget.userName,
      avatarId: replyTarget.avatarId,
    } : null)]);
    setMessageText("");
    setReplyTarget(null);
  };

  return (
    <div className={`${s.page} ${s.roomPage}`}>
      <ChatWorkspace
        roomId={selectedRoom.id}
        roomName={selectedRoom.name}
        roomCategory={selectedRoom.category}
        rooms={previewRooms}
        directChats={previewChats}
        onlineUsers={previewMembers}
        currentUserId={previewUser.uid}
        currentUserName={nickname}
        currentUserAvatar={avatarId}
        headerControls={
          <ChatHeaderControls
            workspace
            onOpenSettings={() => setSettingsOpen(true)}
            onGoToRooms={() => undefined}
            onGoToDirectMessages={() => undefined}
            onLogout={() => undefined}
          />
        }
        onOpenRoom={(room) => setSelectedRoom(room)}
        onNavigate={() => undefined}
        onOpenSettings={() => setSettingsOpen(true)}
      >
        <RoomRoleBar currentRoomRole="member" canModerateCurrentRoom={false} />
        <ChatSearchBar
          searchQuery={searchQuery}
          resultCount={filteredMessages.length}
          hasActiveSearch={Boolean(searchQuery)}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />
        <ChatMessages
          messages={filteredMessages}
          searchQuery={searchQuery}
          currentUserId={previewUser.uid}
          currentUserEmail={previewUser.email ?? ""}
          currentUserName={nickname}
          currentUserAvatar={avatarId}
          mentionAliases={mentionAliases}
          messagesEndRef={messagesEndRef}
          editingMessageId={null}
          editDraft=""
          processingMessageId={null}
          canModerate={false}
          onStartEdit={() => undefined}
          onCancelEdit={() => undefined}
          onEditDraftChange={() => undefined}
          onSaveEdit={() => undefined}
          onDeleteMessage={() => undefined}
          onReplyMessage={(message) => {
            setReplyTarget(message);
            inputRef.current?.focus();
          }}
        />
        <ChatPresenceBar
          onlineUsers={previewMembers}
          typingUsers={previewMembers.filter((user) => user.isTyping)}
          notificationPermission={"unsupported" as NotificationPermissionState}
          onEnableNotifications={() => undefined}
          showParticipants={false}
        />
        <ChatInput
          input={messageText}
          sending={false}
          replyTarget={replyTarget}
          inputRef={inputRef}
          onChange={setMessageText}
          onCancelReply={() => setReplyTarget(null)}
          onSubmit={handleSend}
        />
      </ChatWorkspace>
      {settingsOpen && (
        <ChatSettingsModal
          authUser={previewUser}
          nickname={nickname}
          avatarId={avatarId}
          nicknameError=""
          savingNickname={false}
          currentUserName={nickname}
          onClose={() => setSettingsOpen(false)}
          onSubmit={(event) => {
            event?.preventDefault();
            setSettingsOpen(false);
          }}
          onNicknameChange={setNickname}
          onAvatarChange={setAvatarId}
        />
      )}
    </div>
  );
};
