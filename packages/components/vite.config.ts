import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  // Keep emitted CSS font URLs package-relative so a consuming Vite app can
  // reprocess them instead of requesting its own `/assets/...` paths.
  base: "./",
  plugins: [react()],
  // The exporter serves the authored resources locally; the library build
  // emits only imported runtime files and must not copy the whole catalog a
  // second time into `dist`.
  publicDir: command === "serve" ? "assets" : false,
  build: {
    lib: { entry: { index: "src/index.ts", "react/index": "src/react/index.tsx", export: "src/export.ts", cli: "src/cli.ts" }, formats: ["es"], fileName: (_format, entryName) => `${entryName}.js` },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", /^node:/],
      output: { assetFileNames: (asset) => asset.name === "components.css" ? "styles.css" : "assets/[name]-[hash][extname]" },
    },
  },
  resolve: { alias: { "@mighty-decks/spec": fileURLToPath(new URL("../../spec", import.meta.url)) } },
}));
