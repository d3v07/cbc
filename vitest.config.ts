import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  esbuild: {
    // Match tsconfig's jsx: "preserve" → Next handles it. For Vitest we want
    // the automatic runtime so component .tsx files compile without an
    // explicit `import React`.
    jsx: "automatic",
  },
  test: {
    environment: "node",
    environmentMatchGlobs: [
      ["tests/components/**", "happy-dom"],
      ["tests/lib/video/**", "happy-dom"],
    ],
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
