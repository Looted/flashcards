import { test, expect } from "@playwright/test";
import { waitForAppReady, clearBrowserStorage, startGameSession, playCompleteClassicGame, mockFirebaseAuth, ensureMenuClosed } from "../src/test-helpers";

test.describe("Authentication User Stories", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    // Clear storage after page loads to avoid security errors
    await clearBrowserStorage(page);
  });

  test("Guest User Plays a Game and Signs Up with Email", async ({ page }) => {
    // Mock vocabulary data for the game
    await page.route("**/i18n/hr_en.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "1", term: "hello", definition: "greeting", example: "say hello" },
        ]),
      });
    });
    await page.route("**/i18n/hr_pl.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "1", term_translation: "cześć", definition_translation: "powitanie", example_translation: "powieść cześć" },
        ]),
      });
    });

    // Play a short game session as a guest (3 rounds)
    await startGameSession(page, "HR Words", "Classic");
    await playCompleteClassicGame(page, "hello");

    // Go to summary screen
    await expect(page.locator("text=Session Complete!")).toBeVisible({ timeout: 15000 });

    // Open settings menu
    await page.click("[data-testid='user-menu-button']");
    await expect(page.locator("[data-testid='signin-button']")).toBeVisible();

    // Click Sign In
    await page.click("[data-testid='signin-button']");
    await expect(page.locator("text=Continue with Google")).toBeVisible();
    await expect(page.locator("text=Continue with Email")).toBeVisible();

    // Sign up with email
    await page.click("text=Continue with Email");
    // Initial mode is Sign In, switch to Sign Up
    await page.click("text=Don't have an account? Sign up");
    await expect(page.locator("h2:has-text('Create Account')")).toBeVisible();

    const email = `test-${Date.now()}@example.com`;
    const password = "password123";

    await page.fill("[data-testid='email-input']", email);
    await page.fill("[data-testid='password-input']", password);
    await page.click("[data-testid='submit-button']");

    // Verify successful sign-up and authentication
    await expect(page.locator("[data-testid='user-menu-button']")).toBeVisible();

    // Open menu to verify details
    await page.click("[data-testid='user-menu-button']");
    await expect(page.locator("#settings-menu-title")).toBeVisible(); // Wait for menu to open
    await expect(page.locator("text=Account")).toBeVisible();
    await expect(page.locator(`text=${email}`)).toBeVisible();

    // Close menu by clicking again or clicking outside
    await ensureMenuClosed(page);

    // Verify migration status
    await expect(page.locator("text=Migrating data...")).not.toBeVisible({ timeout: 10000 }); // Should migrate and disappear

    // Sign out to prepare for re-login check
    await page.click("[data-testid='user-menu-button']");
    await page.click("[data-testid='signout-button']");

    // Wait for menu to close and auth state to update
    await page.waitForTimeout(1000);

    // Sign out closes the menu, so we need to open it again to verify we are signed out
    await page.click("[data-testid='user-menu-button']");
    // Wait for menu to actually open
    await expect(page.locator("#settings-menu-title")).toBeVisible();
    await expect(page.locator("[data-testid='signin-button']")).toBeVisible();

    // Re-login with the same email/password
    await page.click("[data-testid='signin-button']");
    await page.click("text=Continue with Email");
    // Mode defaults to Sign In, so we can proceed directly
    await page.fill("[data-testid='email-input']", email);
    await page.fill("[data-testid='password-input']", password);
    await page.click("[data-testid='submit-button']");

    // Verify successful re-login
    await expect(page.locator("[data-testid='user-menu-button']")).toBeVisible();
    await page.click("[data-testid='user-menu-button']");
    await expect(page.locator("#settings-menu-title")).toBeVisible(); // Wait for menu to open
    await expect(page.locator(`text=${email}`)).toBeVisible();
    await ensureMenuClosed(page);
  });

  test("Existing User Signs In with Google and Plays a Game", async ({ page }) => {
    const email = `test-google-${Date.now()}@example.com`;

    await test.step('Setup mocks and authenticate', async () => {
      // Mock vocabulary data for the game to ensure consistent test results
      await page.route("**/i18n/hr_en.json", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: "1", term: "hello", definition: "greeting", example: "say hello" },
          ]),
        });
      });
      await page.route("**/i18n/hr_pl.json", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: "1", term_translation: "cześć", definition_translation: "powitanie", example_translation: "powieść cześć" },
          ]),
        });
      });

      // Use Firebase Emulator REST API to create and authenticate a user
      await mockFirebaseAuth(page, email, "password123", "Test Google User");

      await expect(page.locator("text=Master Business Lingo")).toBeVisible();
    });

    await test.step('Verify user authentication in menu', async () => {
      await expect(page.locator("[data-testid='user-menu-button']")).toBeVisible();
      await page.click("[data-testid='user-menu-button']");
      await expect(page.locator("#settings-menu-title")).toBeVisible();

      // Explicitly wait for the user details to be populated (this depends on Auth Service signals)
      try {
        await page.waitForSelector("text=Test Google User", { state: 'visible', timeout: 5000 });
      } catch (e) {
        // It might be blocked by 'Account' header or similar
        const menuText = await page.locator("#settings-menu-title").evaluate(el => el.closest('div[role="dialog"]')?.textContent);
        console.log(`[TEST] Menu content: ${menuText?.substring(0, 200)}...`);

        // Retry once more with longer timeout
        await expect(page.locator("text=Test Google User")).toBeVisible({ timeout: 10000 });
      }

      await ensureMenuClosed(page);
    });

    await test.step('Play game session', async () => {
      // Play a game session (3 rounds)
      await startGameSession(page, "HR Words", "Classic");
      await playCompleteClassicGame(page, "hello");
    });

    await test.step('Verify summary screen', async () => {
      await expect(page.locator("text=Session Complete!")).toBeVisible({ timeout: 15000 });
    });

    await test.step('Log out', async () => {
      await page.click("[data-testid='user-menu-button']"); // Open menu
      await expect(page.locator("[data-testid='signout-button']")).toBeVisible();
      await page.click("[data-testid='signout-button']");

      // Sign out closes the menu, so we need to open it again to verify we are signed out (signin button visible)
      await page.click("[data-testid='user-menu-button']");
      await expect(page.locator("[data-testid='signin-button']")).toBeVisible();
    });
  });
});
