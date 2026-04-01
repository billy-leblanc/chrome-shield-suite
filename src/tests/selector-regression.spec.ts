/**
 * Selector Regression Suite — Chrome Shield Suite
 *
 * Verifies that the CSS selectors and text-content patterns defined in
 * src/content/payment_interceptor.tsx still match elements on the live
 * payment pages for PayPal, Venmo, and Zelle.
 *
 * These tests are intentionally read-only: they never log in, submit
 * payments, or mutate page state.  They only check that at least one
 * element matching each selector (or text pattern) is present somewhere
 * on the page — including the login / landing page — so the test can run
 * without credentials.
 *
 * If a platform is unreachable (DNS failure, network timeout, unexpected
 * redirect that returns a non-2xx status for every URL we try) the whole
 * describe block is skipped with an explanatory message rather than
 * failing the run.
 */

import { test, expect, chromium, type Browser, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Constants — must mirror PORTAL_CONFIGS and TEXT_FALLBACK_PATTERNS exactly
// ---------------------------------------------------------------------------

const PAYPAL_SELECTORS = [
  '[data-testid="submit-button"]',
  '[data-testid="send-money-submit"]',
  'button[name="payment-submit-btn"]',
  '#payment-submit-btn',
  'button.send-money-submit',
  '#sendMoneyButton',
  '.paypal-button',
];

const VENMO_SELECTORS = [
  'button[data-testid="pay-button"]',
  'button[aria-label="Pay"]',
];

/** Text patterns from TEXT_FALLBACK_PATTERNS in payment_interceptor.tsx */
const VENMO_TEXT_PATTERNS = /^(Pay|Pay Now|Send|Send Money)$/i;
const ZELLE_TEXT_PATTERNS = /^Send Money$/i;

const ZELLE_SELECTORS = [
  '#send-money-zelle-button',
  '#sendmoney-button',
  'button[type="submit"]',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_TIMEOUT = 15_000; // 15 s — generous for live network requests

/**
 * Attempt to navigate to a URL and return {ok: true, page} on success or
 * {ok: false, reason} if the page is unreachable (network error or no DOM).
 */
type NavResult = { ok: true; page: Page; reason?: undefined } | { ok: false; reason: string };

async function tryNavigate(
  browser: Browser,
  url: string
): Promise<NavResult> {
  let page: Page | undefined;
  try {
    page = await browser.newPage();
    // Abort heavy resources to keep the test fast and focused on DOM structure.
    await page.route("**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,mp4,mp3}", (route) =>
      route.abort()
    );
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: TEST_TIMEOUT,
    });
    if (!response) {
      await page.close();
      return { ok: false, reason: `No response received from ${url}` };
    }
    return { ok: true, page };
  } catch (err: unknown) {
    if (page) await page.close().catch(() => undefined);
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: message };
  }
}

/**
 * Returns true if at least one button on the page has textContent that
 * matches the given regex (after trimming and collapsing whitespace).
 */
async function pageHasButtonWithText(page: Page, pattern: RegExp): Promise<boolean> {
  return page.evaluate((patternSource: string) => {
    const re = new RegExp(patternSource, "i");
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    return buttons.some((btn) => {
      const normalized = (btn.textContent ?? "").trim().replace(/\s+/g, " ");
      return re.test(normalized);
    });
  }, pattern.source);
}

// ---------------------------------------------------------------------------
// PayPal
// ---------------------------------------------------------------------------

test.describe("PayPal — CSS selector regression", () => {
  let browser: Browser;
  let page: Page;
  let skipReason: string | null = null;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    const result = await tryNavigate(browser, "https://www.paypal.com/signin");
    if (!result.ok) {
      skipReason = `PayPal unreachable: ${result.reason}`;
    } else {
      page = result.page;
    }
  });

  test.afterAll(async () => {
    if (page) await page.close().catch(() => undefined);
    if (browser) await browser.close().catch(() => undefined);
  });

  for (const selector of PAYPAL_SELECTORS) {
    test(
      `selector "${selector}" exists on page`,
      { timeout: TEST_TIMEOUT },
      async () => {
        if (skipReason) {
          test.skip(true, skipReason);
          return;
        }
        const count = await page.locator(selector).count();
        expect(
          count,
          `PayPal CSS selector [${selector}] not found — selector may have changed or been removed from the PayPal DOM`
        ).toBeGreaterThan(0);
      }
    );
  }
});

// ---------------------------------------------------------------------------
// Venmo — CSS selectors
// ---------------------------------------------------------------------------

test.describe("Venmo — CSS selector regression", () => {
  let browser: Browser;
  let page: Page;
  let skipReason: string | null = null;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    // Try the payment page first; fall back to the marketing/login page.
    let result = await tryNavigate(browser, "https://venmo.com/pay");
    if (!result.ok) {
      result = await tryNavigate(browser, "https://venmo.com");
    }
    if (!result.ok) {
      skipReason = `Venmo unreachable: ${result.reason}`;
    } else {
      page = result.page;
    }
  });

  test.afterAll(async () => {
    if (page) await page.close().catch(() => undefined);
    if (browser) await browser.close().catch(() => undefined);
  });

  for (const selector of VENMO_SELECTORS) {
    test(
      `selector "${selector}" exists on page`,
      { timeout: TEST_TIMEOUT },
      async () => {
        if (skipReason) {
          test.skip(true, skipReason);
          return;
        }
        const count = await page.locator(selector).count();
        expect(
          count,
          `Venmo CSS selector [${selector}] not found — selector may have changed or been removed from the Venmo DOM`
        ).toBeGreaterThan(0);
      }
    );
  }
});

// ---------------------------------------------------------------------------
// Venmo — text-content fallback patterns
// ---------------------------------------------------------------------------

test.describe("Venmo — text-content fallback patterns", () => {
  let browser: Browser;
  let page: Page;
  let skipReason: string | null = null;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    let result = await tryNavigate(browser, "https://venmo.com/pay");
    if (!result.ok) {
      result = await tryNavigate(browser, "https://venmo.com");
    }
    if (!result.ok) {
      skipReason = `Venmo unreachable: ${result.reason}`;
    } else {
      page = result.page;
    }
  });

  test.afterAll(async () => {
    if (page) await page.close().catch(() => undefined);
    if (browser) await browser.close().catch(() => undefined);
  });

  test(
    `at least one button matches text pattern ${VENMO_TEXT_PATTERNS}`,
    { timeout: TEST_TIMEOUT },
    async () => {
      if (skipReason) {
        test.skip(true, skipReason);
        return;
      }
      const found = await pageHasButtonWithText(page, VENMO_TEXT_PATTERNS);
      expect(
        found,
        `Venmo text-content fallback pattern ${VENMO_TEXT_PATTERNS} matched no button — ` +
          `button labels may have changed ("Pay", "Pay Now", "Send", "Send Money" are all expected)`
      ).toBe(true);
    }
  );
});

// ---------------------------------------------------------------------------
// Zelle — CSS selectors
// ---------------------------------------------------------------------------

test.describe("Zelle — CSS selector regression", () => {
  let browser: Browser;
  let page: Page;
  let skipReason: string | null = null;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    // zellepay.com is the domain used in PORTAL_CONFIGS.
    let result = await tryNavigate(browser, "https://www.zellepay.com/pay-it");
    if (!result.ok) {
      result = await tryNavigate(browser, "https://www.zellepay.com");
    }
    if (!result.ok) {
      skipReason = `Zelle unreachable: ${result.reason}`;
    } else {
      page = result.page;
    }
  });

  test.afterAll(async () => {
    if (page) await page.close().catch(() => undefined);
    if (browser) await browser.close().catch(() => undefined);
  });

  for (const selector of ZELLE_SELECTORS) {
    test(
      `selector "${selector}" exists on page`,
      async () => {
        if (skipReason) {
          test.skip(true, skipReason);
          return;
        }
        const count = await page.locator(selector).count();
        expect(
          count,
          `Zelle CSS selector [${selector}] not found — selector may have changed or been removed from the Zelle DOM`
        ).toBeGreaterThan(0);
      },
      { timeout: TEST_TIMEOUT }
    );
  }
});

// ---------------------------------------------------------------------------
// Zelle — text-content fallback patterns
// ---------------------------------------------------------------------------

test.describe("Zelle — text-content fallback patterns", () => {
  let browser: Browser;
  let page: Page;
  let skipReason: string | null = null;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    let result = await tryNavigate(browser, "https://www.zellepay.com/pay-it");
    if (!result.ok) {
      result = await tryNavigate(browser, "https://www.zellepay.com");
    }
    if (!result.ok) {
      skipReason = `Zelle unreachable: ${result.reason}`;
    } else {
      page = result.page;
    }
  });

  test.afterAll(async () => {
    if (page) await page.close().catch(() => undefined);
    if (browser) await browser.close().catch(() => undefined);
  });

  test(
    `at least one button matches text pattern ${ZELLE_TEXT_PATTERNS}`,
    async () => {
      if (skipReason) {
        test.skip(true, skipReason);
        return;
      }
      const found = await pageHasButtonWithText(page, ZELLE_TEXT_PATTERNS);
      expect(
        found,
        `Zelle text-content fallback pattern ${ZELLE_TEXT_PATTERNS} matched no button — ` +
          `button label "Send Money" may have changed`
      ).toBe(true);
    },
    { timeout: TEST_TIMEOUT }
  );
});
