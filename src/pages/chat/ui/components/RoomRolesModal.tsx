import type { RoomMember, RoomRole } from "@/entities/room/model/types";
import { roomRoleItems, roomRoleTranslationKeys } from "@/entities/room/model/roles";
import { Button } from "@/shared/ui/button";
import { useAppPreferences } from "@/shared/model/preferences";
import s from "../chatPage.module.css";

type RoomRolesModalProps = {
  members: RoomMember[];
  currentUserId: string;
  updatingUserId: string | null;
  onClose: () => void;
  onChangeRole: (member: RoomMember, role: RoomRole) => void;
};

export const RoomRolesModal = ({ members, currentUserId, updatingUserId, onClose, onChangeRole }: RoomRolesModalProps) => {
  const { t } = useAppPreferences();

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modalWide} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="room-roles-title">
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle} id="room-roles-title">
            {t("roomRolesTitle")}
          </h2>
          <button type="button" className={s.modalClose} onClick={onClose} aria-label={t("roomRolesClose")}>
            ×
          </button>
        </div>

        <div className={s.rolesList}>
          {members.map((member) => {
            const isOwner = member.role === "owner";
            const isCurrentUser = member.userId === currentUserId;
            const isUpdating = updatingUserId === member.userId;

            return (
              <div key={member.userId} className={s.roleRow}>
                <div className={s.roleIdentity}>
                  <span className={s.roleName}>{member.userName}</span>
                  <span className={s.roleUserId}>{isCurrentUser ? t("roomRolesYou") : member.userId}</span>
                </div>
                <div className={s.roleSelector} role="group" aria-label={t("roomRolesSelectAria", { name: member.userName })}>
                  {roomRoleItems.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`${s.roleOption} ${member.role === role ? s.roleOptionActive : ""}`}
                      disabled={isOwner || role === "owner" || isUpdating}
                      onClick={() => onChangeRole(member, role)}
                    >
                      {isUpdating && member.role !== role ? t("roomRolesUpdating") : t(roomRoleTranslationKeys[role])}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className={s.modalActions}>
          <Button type="button" onClick={onClose}>
            {t("commonSave")}
          </Button>
        </div>
      </div>
    </div>
  );
};
