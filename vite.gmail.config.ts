import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Separate build for the Gmail content script.
// Same IIFE pattern as the payment content script.
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
      input: path.resolve(__dirname, "src/content/gmail_scanner.tsx"),
      output: {
        entryFileNames: "gmail-content.js",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
  },
});
