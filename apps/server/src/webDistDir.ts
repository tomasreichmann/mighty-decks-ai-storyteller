import { resolve } from "node:path";

export const resolveWebDistDir = (serverModuleDir: string): string =>
  resolve(serverModuleDir, "..", "..", "web", "dist");
