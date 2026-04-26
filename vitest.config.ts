import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environmentMatchGlobs: [
      ["tests/components/**", "happy-dom"],
      ["tests/lib/video/**", "happy-dom"],
    ],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
