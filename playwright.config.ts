import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: { browserName: "chromium" },
  projects: [
    {
      name: "local",
      testMatch: "calculator.spec.ts",
      use: { baseURL: "http://127.0.0.1:3017" },
    },
    {
      name: "supabase-mocked",
      testMatch: "history.spec.ts",
      use: { baseURL: "http://127.0.0.1:3018" },
    },
  ],
  webServer: [
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3017",
      url: "http://127.0.0.1:3017",
      reuseExistingServer: false,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
        KALKULATE_BUILD_DIR: ".next-e2e-local",
      },
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3018",
      url: "http://127.0.0.1:3018",
      reuseExistingServer: false,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://kalkulate-test.invalid",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_test_fixture_only",
        KALKULATE_BUILD_DIR: ".next-e2e-remote",
      },
    },
  ],
});
