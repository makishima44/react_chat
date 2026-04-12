const TRAILING_MENTION_PUNCTUATION_REGEX = /[.,!?;:)\]}>"']+$/;
const SPACE_REGEX = /\s+/g;
const MENTION_PART_REGEX = /(@[^\s@]{2,64})/g;

const normalizeAlias = (value: string) => value.trim().toLowerCase();

export const normalizeMentionToken = (token: string) => {
  const raw = token.trim().replace(/^@+/, "");
  const withoutTrailingPunctuation = raw.replace(TRAILING_MENTION_PUNCTUATION_REGEX, "");
  return normalizeAlias(withoutTrailingPunctuation);
};

export const getMentionAliases = (currentUserName: string, currentUserEmail: string) => {
  const aliases = new Set<string>();

  const addCandidate = (candidate: string) => {
    const normalized = normalizeAlias(candidate);
    if (!normalized) return;

    aliases.add(normalized);
    aliases.add(normalized.replace(SPACE_REGEX, ""));
    aliases.add(normalized.replace(SPACE_REGEX, "_"));
    aliases.add(normalized.replace(SPACE_REGEX, "-"));
  };

  addCandidate(currentUserName);
  addCandidate(currentUserEmail);

  const emailLocalPart = currentUserEmail.split("@")[0] ?? "";
  addCandidate(emailLocalPart);

  return Array.from(aliases);
};

export const isMessageMentioningUser = (text: string, mentionAliases: string[]) => {
  if (!text.trim() || mentionAliases.length === 0) return false;

  const aliasSet = new Set(mentionAliases.map(normalizeAlias));
  const parts = text.match(MENTION_PART_REGEX) ?? [];
  return parts.some((part) => aliasSet.has(normalizeMentionToken(part)));
};

export type MentionChunk = {
  text: string;
  isMention: boolean;
  isCurrentUserMention: boolean;
};

export const splitMessageByMentions = (text: string, mentionAliases: string[]): MentionChunk[] => {
  if (!text) {
    return [{ text: "", isMention: false, isCurrentUserMention: false }];
  }

  const aliasSet = new Set(mentionAliases.map(normalizeAlias));

  return text.split(MENTION_PART_REGEX).map((part) => {
    const isMention = part.startsWith("@");
    if (!isMention) {
      return { text: part, isMention: false, isCurrentUserMention: false };
    }

    return {
      text: part,
      isMention: true,
      isCurrentUserMention: aliasSet.has(normalizeMentionToken(part)),
    };
  });
};
