import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        // ponytail: only react is worth its own chunk; everything else is small
        manualChunks: (id) =>
          id.includes("node_modules/react") ? "react" : undefined,
      },
    },
  },
});
