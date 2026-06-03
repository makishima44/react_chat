import type { RoomRole } from "@/entities/room/model/types";
import { roomRoleTranslationKeys } from "@/entities/room/model/roles";
import { useAppPreferences } from "@/shared/model/preferences";
import s from "../chatPage.module.css";

type RoomRoleBarProps = {
  currentRoomRole: RoomRole;
  canModerateCurrentRoom: boolean;
};

export const RoomRoleBar = ({ currentRoomRole, canModerateCurrentRoom }: RoomRoleBarProps) => {
  const { t } = useAppPreferences();

  return (
    <div className={s.roomRoleBar}>
      <span className={s.roomRoleLabel}>{t("roomRoleCurrent")}:</span>
      <span className={s.roomRoleValue}>{t(roomRoleTranslationKeys[currentRoomRole])}</span>
      {canModerateCurrentRoom && <span className={s.roomRoleCapability}>{t("roomRoleCanModerate")}</span>}
    </div>
  );
};
