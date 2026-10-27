import astronaut from "@/shared/assets/avatars/astronaut.png";
import robot from "@/shared/assets/avatars/robot.png";
import fox from "@/shared/assets/avatars/fox.png";
import alien from "@/shared/assets/avatars/alien.png";
import cat from "@/shared/assets/avatars/cat.png";
import ghost from "@/shared/assets/avatars/ghost.png";

export const avatarOptions = [
  { id: "astronaut", image: astronaut, label: "avatarAstronaut" },
  { id: "robot", image: robot, label: "avatarRobot" },
  { id: "fox", image: fox, label: "avatarFox" },
  { id: "alien", image: alien, label: "avatarAlien" },
  { id: "cat", image: cat, label: "avatarCat" },
  { id: "ghost", image: ghost, label: "avatarGhost" },
] as const;

export type AvatarId = (typeof avatarOptions)[number]["id"];

export const DEFAULT_AVATAR_ID: AvatarId = "astronaut";

export const isAvatarId = (value: unknown): value is AvatarId =>
  typeof value === "string" && avatarOptions.some((avatar) => avatar.id === value);

export const getAvatar = (avatarId: AvatarId) => avatarOptions.find((avatar) => avatar.id === avatarId) ?? avatarOptions[0];

export const getAvatarIdForUser = (userId: string) => {
  if (!userId) return DEFAULT_AVATAR_ID;

  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash * 31 + userId.charCodeAt(index)) | 0;
  }

  return avatarOptions[Math.abs(hash) % avatarOptions.length].id;
};
