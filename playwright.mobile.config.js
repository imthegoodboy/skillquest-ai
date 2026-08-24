import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/mobile",
  workers: 1,
  timeout: 70_000,
  expect: { timeout: 12_000 },
  use: {
    baseURL: "http://127.0.0.1:5202",
    viewport: { width: 1080, height: 980 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/make-mobile-manifest.mjs && anna-app dev --port 5202 --manifest manifest.qa-mobile.json --bundle bundle --mock-llm fixtures/skill-plan.jsonl",
    url: "http://127.0.0.1:5202/",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
