import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: "assets",
  build: {
    lib: { entry: { index: "src/index.ts", "react/index": "src/react/index.tsx", export: "src/export.ts", cli: "src/cli.ts" }, formats: ["es"], fileName: (_format, entryName) => `${entryName}.js` },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", /^node:/],
      output: { assetFileNames: (asset) => asset.name === "components.css" ? "styles.css" : "assets/[name]-[hash][extname]" },
    },
  },
  resolve: { alias: { "@mighty-decks/spec": fileURLToPath(new URL("../../spec", import.meta.url)) } },
});
