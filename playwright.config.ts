import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3138", headless: true },
  webServer: {
    command:
      "PORTAL_PREVIEW=1 next dev --webpack --port 3138 --hostname 127.0.0.1",
    url: "http://127.0.0.1:3138/jobs",
    reuseExistingServer: false,
    timeout: 120000,
  },
  reporter: "list",
  outputDir: "test-results",
});
