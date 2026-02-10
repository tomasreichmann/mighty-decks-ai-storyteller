import { generateUuid } from "./randomId";

export const createAdventureId = (): string => {
  const stamp = Date.now().toString(36).slice(-5);
  const noise = Math.random().toString(36).slice(2, 6);
  return `adv-${stamp}${noise}`;
};

export interface ClientIdentity {
  playerId: string;
  displayName: string;
}

const getOrCreateStorageValue = (key: string, factory: () => string): string => {
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const generated = factory();
  window.localStorage.setItem(key, generated);
  return generated;
};

export const createEphemeralPlayerId = (role: "player" | "screen"): string =>
  getOrCreateStorageValue(`mighty_decks_${role}_id`, () => `p-${generateUuid()}`);

export const getClientIdentity = (role: "player" | "screen"): ClientIdentity => {
  const playerId = createEphemeralPlayerId(role);
  const displayName = getOrCreateStorageValue(`mighty_decks_${role}_display_name`, () => {
    if (role === "screen") {
      return "Table Screen";
    }

    return `Player ${playerId.slice(-4).toUpperCase()}`;
  });

  return {
    playerId,
    displayName,
  };
};
