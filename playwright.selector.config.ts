/**
 * Playwright configuration for the selector regression test suite.
 *
 * This is a standalone config that does not depend on lovable-agent-playwright-config
 * (which is not available in local dev environments). Use it with:
 *
 *   npx playwright test src/tests/selector-regression.spec.ts \
 *     --config=playwright.selector.config.ts --reporter=list
 */
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testMatch: ["src/tests/selector-regression.spec.ts"],
  timeout: 30_000,
  retries: 0,
  workers: 1, // sequential — each describe block opens its own browser
  use: {
    headless: true,
    // No baseURL — tests navigate to absolute URLs directly.
  },
  reporter: [["list"]],
});
