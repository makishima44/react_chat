import type { RoomCategory } from "./types";

export const roomCategoryIcons: Record<RoomCategory, string> = {
  general: "✦",
  tech: "▤",
  creative: "◉",
  music: "♫",
  gaming: "✥",
  books: "▣",
  "off-topic": "◒",
};

export const getRoomCategoryIcon = (category?: RoomCategory) =>
  (category && roomCategoryIcons[category]) || roomCategoryIcons.general;
