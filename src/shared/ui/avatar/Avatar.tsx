import clsx from "clsx";
import { getAvatar, type AvatarId } from "@/entities/user/model/avatarOptions";
import s from "./avatar.module.css";

type AvatarProps = {
  avatarId: AvatarId;
  alt?: string;
  size?: "small" | "medium" | "large";
  className?: string;
};

export const Avatar = ({ avatarId, alt = "", size = "medium", className }: AvatarProps) => {
  const avatar = getAvatar(avatarId);

  return <img className={clsx(s.avatar, s[size], className)} src={avatar.image} alt={alt} loading="lazy" draggable={false} />;
};
