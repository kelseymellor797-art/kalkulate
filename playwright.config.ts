import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:3003", browserName: "chromium" },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3003",
    url: "http://127.0.0.1:3003",
    reuseExistingServer: !process.env.CI,
  },
});
