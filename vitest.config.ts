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
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
