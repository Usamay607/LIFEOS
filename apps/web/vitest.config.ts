import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@los/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
      "@los/notion": path.resolve(__dirname, "../../packages/notion/src/index.ts"),
    },
  },
});
