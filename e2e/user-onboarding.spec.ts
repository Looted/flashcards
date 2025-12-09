import { test, expect } from "@playwright/test";
import { waitForAppReady, clearBrowserStorage, startGameSession, playCompleteClassicGame, mockFirebaseAuth, ensureMenuClosed } from "../src/test-helpers";

test.describe("User Onboarding Journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await clearBrowserStorage(page);
  });

  test("New User Discovers App, Signs Up with Google, and Explores Features", async ({ page }) => {
    // Mock vocabulary data for the game (same as working auth test)
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

    // Step 1: Anonymous user discovers the app (already loaded by beforeEach)
    await expect(page.locator("text=Master Business Lingo")).toBeVisible();

    // Browse available game modes
    await expect(page.locator("text=Tech")).toBeVisible();
    await expect(page.locator("text=Finance")).toBeVisible();
    await expect(page.locator("text=Sales")).toBeVisible();
    await expect(page.locator("text=HR")).toBeVisible();
    await expect(page.locator("text=Strategy")).toBeVisible();

    // Step 2: Try a game as guest to see value (3 rounds)
    await startGameSession(page, "HR", "Classic");

    await playCompleteClassicGame(page, "hello");

    // Step 3: Reach summary and see sign-up prompt
    await expect(page.locator("text=Session Complete!")).toBeVisible();

    // Open settings menu to see sign-in option
    await page.click("[data-testid='user-menu-button']");
    await expect(page.locator("[data-testid='signin-button']")).toBeVisible();

    // Step 4: Sign up with Google
    await page.click("[data-testid='signin-button']");
    await expect(page.locator("text=Continue with Google")).toBeVisible();

    // Use Firebase Emulator REST API to create and authenticate a user
    await mockFirebaseAuth(page, "test-google@example.com", "password123", "Test Google User");

    // Verify user is now authenticated (menu is still open, so we should see the user name)
    await expect(page.locator("text=Test Google User")).toBeVisible();

    // Verify user is now authenticated
    await expect(page.locator("[data-testid='user-menu-button']")).toBeVisible();

    // Close menu to reveal the home page
    await ensureMenuClosed(page);

    // We are on the summary screen, navigate back to home
    await page.click("text=Back to Home");

    await expect(page.locator("text=Master Business Lingo")).toBeVisible();

    // Check user menu again to be sure (optional, but consistent with flow)
    await page.click("[data-testid='user-menu-button']");
    await expect(page.locator("#settings-menu-title")).toBeVisible(); // Wait for menu to open
    await expect(page.locator("text=Test Google User")).toBeVisible();
    await ensureMenuClosed(page);

    // Step 5: Explore settings as authenticated user
    await page.click("[data-testid='user-menu-button']");
    await expect(page.locator("#settings-menu-title")).toBeVisible();

    // Try theme switching
    const themeButton = page.locator("button").filter({ hasText: /light|dark|system/ });
    const initialTheme = await themeButton.textContent();
    await themeButton.click();
    // Use Playwright assertion which retries
    if (initialTheme) {
      await expect(themeButton).not.toHaveText(initialTheme);
    }

    // Try language switching
    await page.click("[data-testid='language-button-pl']");
    await expect(page.locator("app-language-switcher span.md\\:block")).toHaveText("Polski");

    // Step 6: Complete onboarding by logging out
    await page.click("[data-testid='signout-button']");
    // Menu closes on sign out, wait for it to close
    await expect(page.locator("#settings-menu-title")).not.toBeVisible();

    // Open menu again to verify we are logged out
    await page.click("[data-testid='user-menu-button']");
    await expect(page.locator("[data-testid='signin-button']")).toBeVisible();
  });
});
