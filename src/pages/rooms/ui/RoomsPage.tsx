import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { auth } from "@/shared/api/firebase/firebaseConfig";
import { TerminalFrame } from "@/shared/ui/terminal-frame/TerminalFrame";
import { ChatSettingsModal } from "@/pages/chat/ui/components/ChatSettingsModal";

import s from "./roomsPage.module.css";
import { RoomsHeaderControls } from "./components/RoomsHeaderControls";
import { CreateRoomForm } from "./components/CreateRoomForm";
import { RoomsSection } from "./components/RoomsSection";
import { DeleteRoomModal } from "./components/DeleteRoomModal";
import { AccessRoomModal } from "./components/AccessRoomModal";
import { useRoomsQuery } from "../model/useRoomsQuery";
import { useUserSettings } from "../model/useUserSettings";
import { useRoomCreation } from "../model/useRoomCreation";
import { useRoomAccess } from "../model/useRoomAccess";
import { useRoomDeletion } from "../model/useRoomDeletion";
import { useAppPreferences } from "@/shared/model/preferences";

export const RoomsPage = () => {
  const navigate = useNavigate();
  const authUser = auth.currentUser;
  const { t } = useAppPreferences();
  const currentUserId = authUser?.uid ?? "anonymous";
  const currentUserName = authUser?.displayName?.trim() || authUser?.email || t("commonAnonymous");

  const { rooms, roomsError, setRoomsError } = useRoomsQuery(currentUserId);
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
  const {
    newRoomName,
    newRoomPassword,
    createError,
    creating,
    handleRoomNameChange,
    handleRoomPasswordChange,
    handleCreateRoom,
  } = useRoomCreation({
    currentUserId,
    currentUserName,
    navigate,
  });
  const { deletingRoomId, deleteError, deleteTarget, setDeleteError, handleOpenDeleteModal, handleCloseDeleteModal, handleConfirmDelete } =
    useRoomDeletion({
      currentUserId,
    });
  const {
    accessTarget,
    accessPassword,
    accessError,
    handleAccessPasswordChange,
    handleOpenRoom,
    handleCloseAccessModal,
    handleConfirmAccess,
  } = useRoomAccess({
    navigate,
    currentUserId,
    currentUserName,
    clearDeleteError: () => setDeleteError(""),
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch {
      setRoomsError(t("logoutError"));
    }
  };

  return (
    <div className={s.page}>
      <TerminalFrame
        title={t("roomsTitle")}
        subtitle={t("roomsSubtitle")}
        headerSlot={<RoomsHeaderControls currentUserName={currentUserName} onOpenSettings={openSettings} onLogout={handleLogout} />}
        className={s.roomsFrame}
      >
        <div className={s.content}>
          <CreateRoomForm
            newRoomName={newRoomName}
            newRoomPassword={newRoomPassword}
            createError={createError}
            creating={creating}
            onRoomNameChange={handleRoomNameChange}
            onRoomPasswordChange={handleRoomPasswordChange}
            onSubmit={handleCreateRoom}
          />

          <RoomsSection
            rooms={rooms}
            roomsError={roomsError}
            deleteError={deleteError}
            deletingRoomId={deletingRoomId}
            currentUserId={currentUserId}
            onOpenRoom={handleOpenRoom}
            onOpenDeleteModal={handleOpenDeleteModal}
          />
        </div>
      </TerminalFrame>

      {deleteTarget && (
        <DeleteRoomModal deleteTarget={deleteTarget} deletingRoomId={deletingRoomId} onClose={handleCloseDeleteModal} onConfirm={handleConfirmDelete} />
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

      {accessTarget && (
        <AccessRoomModal
          accessTarget={accessTarget}
          accessPassword={accessPassword}
          accessError={accessError}
          onPasswordChange={handleAccessPasswordChange}
          onClose={handleCloseAccessModal}
          onConfirm={handleConfirmAccess}
        />
      )}
    </div>
  );
};
