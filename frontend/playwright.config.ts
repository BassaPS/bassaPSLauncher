import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:4188",
    browserName: "chromium",
    trace: "retain-on-failure",
    locale: "ja-JP",
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4188",
    url: "http://127.0.0.1:4188",
    reuseExistingServer: false,
  },
});
