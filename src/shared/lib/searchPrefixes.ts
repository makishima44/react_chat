const MAX_PREFIX_LENGTH = 32;

const normalizeSearchValue = (value: string) => value.trim().toLocaleLowerCase();

const tokenize = (value: string) => {
  const normalized = normalizeSearchValue(value);
  if (!normalized) return [];

  const splitTokens = normalized
    .split(/[^a-zA-Z0-9а-яА-ЯёЁ._-]+/u)
    .map((token) => token.trim())
    .filter(Boolean);

  return Array.from(new Set([normalized, ...splitTokens]));
};

const buildPrefixes = (token: string) => {
  const prefixes: string[] = [];
  const limit = Math.min(token.length, MAX_PREFIX_LENGTH);

  for (let index = 2; index <= limit; index += 1) {
    prefixes.push(token.slice(0, index));
  }

  return prefixes;
};

export const createSearchPrefixes = (...values: string[]) => {
  const unique = new Set<string>();

  values.forEach((value) => {
    tokenize(value).forEach((token) => {
      buildPrefixes(token).forEach((prefix) => unique.add(prefix));
    });
  });

  return Array.from(unique).sort();
};

export const normalizeSearchQuery = (value: string) => normalizeSearchValue(value);
