import { generateUuid } from "./randomId";

const CREATOR_TOKEN_STORAGE_KEY = "mighty_decks_adventure_module_creator_token";
export const ADVENTURE_MODULE_CREATOR_TOKEN_HEADER = "x-md-module-creator-token";

export const getAdventureModuleCreatorToken = (): string => {
  const existing = window.localStorage.getItem(CREATOR_TOKEN_STORAGE_KEY);
  if (existing && existing.trim().length > 0) {
    return existing;
  }

  const created = `amc-${generateUuid()}`;
  window.localStorage.setItem(CREATOR_TOKEN_STORAGE_KEY, created);
  return created;
};
