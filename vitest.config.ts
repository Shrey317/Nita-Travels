import { defineConfig } from "vitest/config";
import path from "path";

// Same reasoning as next.config.js / instrumentation.ts: force UTC so date-only value tests
// aren't sensitive to whatever timezone happens to run them.
process.env.TZ = "UTC";

export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
