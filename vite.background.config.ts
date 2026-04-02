import { defineConfig } from "vite";
import path from "path";

// Builds the Chrome MV3 background service worker.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "extension",
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, "src/background/risk_engine.ts"),
      output: {
        entryFileNames: "background.js",
        format: "es",
        inlineDynamicImports: true,
      },
    },
  },
});
