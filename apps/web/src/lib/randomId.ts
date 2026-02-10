const toHex = (value: number): string => value.toString(16).padStart(2, "0");

const randomUuidFromCryptoValues = (): string => {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);

  // RFC4122 v4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, toHex).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
};

const randomUuidFromMath = (): string => {
  const stamp = Date.now().toString(16);
  const rand = Math.random().toString(16).slice(2).padEnd(24, "0");
  return `${stamp.slice(-8)}-${rand.slice(0, 4)}-4${rand.slice(5, 8)}-a${rand.slice(9, 12)}-${rand.slice(12, 24)}`;
};

export const generateUuid = (): string => {
  if (typeof globalThis.crypto !== "undefined") {
    if (typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }

    if (typeof globalThis.crypto.getRandomValues === "function") {
      return randomUuidFromCryptoValues();
    }
  }

  return randomUuidFromMath();
};

