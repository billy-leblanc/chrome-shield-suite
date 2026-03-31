import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Separate build for the content script.
// Chrome MV3 content scripts cannot use ES module imports — they must be
// fully self-contained. This config produces a single IIFE bundle with all
// dependencies (including React) inlined.
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
      input: path.resolve(__dirname, "src/content/payment_interceptor.tsx"),
      output: {
        entryFileNames: "content.js",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
  },
});
