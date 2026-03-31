import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Separate build for the extension popup.
// Chrome MV3 CSP blocks external CDN scripts — popup must be fully self-contained.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    outDir: "extension",
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, "src/popup.tsx"),
      output: {
        entryFileNames: "popup-bundle.js",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
  },
});
