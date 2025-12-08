import { test, expect } from "@playwright/test";
import { waitForAppReady, clearBrowserStorage } from "../src/test-helpers";

test("Debug Auth Storage", async ({ page }) => {
  await page.goto("/");
  await waitForAppReady(page);
  await clearBrowserStorage(page);

  // Sign in or Sign up via UI
  await page.click("[data-testid='user-menu-button']");
  await page.click("[data-testid='signin-button']");
  await page.click("text=Continue with Email");

  const email = `debug-${Date.now()}@example.com`;
  const password = "password123";

  await page.fill("[data-testid='email-input']", email);
  await page.fill("[data-testid='password-input']", password);
  await page.click("[data-testid='submit-button']");

  // Wait for sign in
  await expect(page.locator("[data-testid='user-menu-button']")).toBeVisible();

  await test.step('Dump storage state', async () => {
    // Dump localStorage
    const local = await page.evaluate(() => Object.entries(localStorage).map(([k, v]) => `${k}: ${v.substring(0, 50)}...`));
    console.log('[DEBUG-STORAGE] localStorage:', local);

    // Dump sessionStorage
    const session = await page.evaluate(() => Object.entries(sessionStorage).map(([k, v]) => `${k}: ${v.substring(0, 50)}...`));
    console.log('[DEBUG-STORAGE] sessionStorage:', session);

    // Check IndexedDB
    const dbs = await page.evaluate(async () => {
      if (!window.indexedDB) return "IndexedDB not supported";
      const dbs = await window.indexedDB.databases();
      return dbs.map(db => db.name);
    });
    console.log('[DEBUG-STORAGE] IndexedDB:', dbs);
  });
});
