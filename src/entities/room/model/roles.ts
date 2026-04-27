import type { Room, RoomMember, RoomRole } from "./types";

const rolePriority: Record<RoomRole, number> = {
  member: 1,
  moderator: 2,
  owner: 3,
};

export const roomRoleItems: RoomRole[] = ["owner", "moderator", "member"];

export const roomRoleTranslationKeys: Record<RoomRole, "roomRole_owner" | "roomRole_moderator" | "roomRole_member"> = {
  owner: "roomRole_owner",
  moderator: "roomRole_moderator",
  member: "roomRole_member",
};

export const getRoomRole = (room: Pick<Room, "createdBy" | "roles" | "members"> | null | undefined, userId: string): RoomRole => {
  if (!room || !userId) return "member";
  if (room.roles?.[userId]) return room.roles[userId];
  if (room.members?.[userId]?.role) return room.members[userId].role;
  if (room.createdBy === userId) return "owner";
  return "member";
};

export const canManageRoom = (room: Pick<Room, "createdBy" | "roles" | "members"> | null | undefined, userId: string) =>
  getRoomRole(room, userId) === "owner";

export const canModerateRoom = (room: Pick<Room, "createdBy" | "roles" | "members"> | null | undefined, userId: string) =>
  rolePriority[getRoomRole(room, userId)] >= rolePriority.moderator;

export const canDeleteRoom = canManageRoom;

export const normalizeRoomMembers = (room: Room): RoomMember[] => {
  const membersById = new Map<string, RoomMember>();

  Object.values(room.members ?? {}).forEach((member) => {
    if (!member.userId) return;
    membersById.set(member.userId, {
      ...member,
      role: member.role ?? getRoomRole(room, member.userId),
    });
  });

  Object.entries(room.roles ?? {}).forEach(([userId, role]) => {
    const existing = membersById.get(userId);
    membersById.set(userId, {
      userId,
      userName: existing?.userName || (userId === room.createdBy ? room.createdByName : undefined) || userId,
      joinedAt: existing?.joinedAt ?? null,
      role,
    });
  });

  if (room.createdBy && !membersById.has(room.createdBy)) {
    membersById.set(room.createdBy, {
      userId: room.createdBy,
      userName: room.createdByName || room.createdBy,
      joinedAt: room.createdAt,
      role: "owner",
    });
  }

  return [...membersById.values()].sort((left, right) => rolePriority[right.role] - rolePriority[left.role] || left.userName.localeCompare(right.userName));
};
