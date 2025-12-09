import { test, expect } from "@playwright/test";
import { waitForAppReady, clearBrowserStorage, startGameSession, playCompleteClassicGame, ensureMenuClosed, createTestUser } from "../src/test-helpers";

test.describe("Authenticated User Journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await clearBrowserStorage(page);
  });

  test("User Signs In with Email, Changes Language, Plays Multiple Games, and Manages Settings", async ({ page }) => {
    // Mock vocabulary data for games
    await page.route("**/i18n/hr_en.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "1",
            term: "meeting",
            definition: "A gathering of people for a purpose",
            example: "We had a team meeting yesterday.",
            metadata: { difficulty: 1, tags: ["business"] }
          }
        ])
      });
    });

    await page.route("**/i18n/strategy_en.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "1",
            term: "milestone",
            definition: "A significant stage or event in a project",
            example: "Reaching the beta release was a major milestone.",
            metadata: { difficulty: 2, tags: ["project-management"] }
          }
        ])
      });
    });

    await page.route("**/i18n/hr_pl.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "1",
            term_translation: "spotkanie",
            definition_translation: "Zbiórka ludzi w jakimś celu",
            example_translation: "Wczoraj mieliśmy spotkanie zespołu."
          }
        ])
      });
    });

    await page.route("**/i18n/strategy_pl.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "1",
            term_translation: "kamień milowy",
            definition_translation: "Znaczący etap lub wydarzenie w projekcie",
            example_translation: "Osiągnięcie wersji beta było głównym kamieniem milowym."
          }
        ])
      });
    });

    // Step 1: Already on main menu from beforeEach
    await expect(page.locator("text=Master Business Lingo")).toBeVisible();

    // Step 2: Sign in with email
    await page.click("[data-testid='user-menu-button']");
    await page.click("[data-testid='signin-button']");
    await page.click("text=Continue with Email");

    const email = `returning-user-${Date.now()}@example.com`;
    const password = "password123";

    // Create user in emulator so we can test sign-in
    await createTestUser(email, password);

    await page.fill("[data-testid='email-input']", email);
    await page.fill("[data-testid='password-input']", password);
    await page.click("[data-testid='submit-button']");

    // Verify successful sign-up
    await expect(page.locator("[data-testid='user-menu-button']")).toBeVisible();

    // Close menu if already open
    await ensureMenuClosed(page);

    await page.click("[data-testid='user-menu-button']"); // Open menu
    await expect(page.locator("#settings-menu-title")).toBeVisible(); // Wait for menu to open
    await expect(page.locator(`text=${email}`)).toBeVisible({ timeout: 30000 });
    await ensureMenuClosed(page); // Close menu

    // Wait for any data migration
    await expect(page.locator("text=Migrating data...")).not.toBeVisible({ timeout: 10000 });

    // Step 3: Change language to Spanish (since default is Polish)
    await page.click("app-language-switcher button");
    await expect(page.locator(".dropdown-menu")).toBeVisible();
    await page.click("button:has-text('Español')");
    await expect(page.locator("app-language-switcher span.md\\:block")).toHaveText("Español");

    // Step 4: Play HR game (3 rounds)
    await startGameSession(page, "HR", "Classic");
    await playCompleteClassicGame(page, "meeting");

    await expect(page.locator("text=Session Complete!")).toBeVisible();

    // Step 5: Switch to Strategy and play another game
    await page.click("text=Back to Home");

    // Play Strategy game (3 rounds)
    await startGameSession(page, "Strategy", "Classic");
    await playCompleteClassicGame(page, "milestone");

    await expect(page.locator("text=Session Complete!")).toBeVisible();

    // Step 6: Access settings menu and explore features
    await page.click("text=Back to Home");
    await page.click("[data-testid='user-menu-button']");
    await expect(page.locator("#settings-menu-title")).toBeVisible();

    // Change theme
    const themeButton = page.locator("[data-testid='theme-toggle-button']");
    const initialTheme = await themeButton.textContent();
    await themeButton.click();
    // Wait for text to change
    await expect(themeButton).not.toHaveText(initialTheme!);

    // Test navigation links
    await page.click("button:has-text('About')"); // About button
    await expect(page.locator("#settings-menu-title")).not.toBeVisible(); // Menu should close

    // Re-open settings
    await page.click("[data-testid='user-menu-button']");
    await page.click("button:has-text('Privacy Policy')"); // Privacy Policy button
    await expect(page.locator("#settings-menu-title")).not.toBeVisible();

    // Step 7: Switch back to Polish
    await page.click("[data-testid='user-menu-button']");
    await page.click("[data-testid='language-button-pl']");
    await expect(page.locator("app-language-switcher span.md\\:block")).toHaveText("Polski");
    await expect(page.locator("text=Master Business Lingo")).toBeVisible();
    await ensureMenuClosed(page);

    // Step 8: Log out
    await page.click("[data-testid='user-menu-button']");
    await expect(page.locator("[data-testid='signout-button']")).toBeVisible();
    await page.click("[data-testid='signout-button']");

    // Menu closes automatically on sign out
    await ensureMenuClosed(page);

    // Re-open menu to verify sign in button
    await page.click("[data-testid='user-menu-button']");
    await expect(page.locator("[data-testid='signin-button']")).toBeVisible({ timeout: 15000 });

    // Step 9: Verify persistence - sign back in
    await page.click("[data-testid='signin-button']");
    await page.click("text=Continue with Email");
    await page.fill("[data-testid='email-input']", email);
    await page.fill("[data-testid='password-input']", password);
    await page.click("[data-testid='submit-button']");

    // Verify successful re-login
    await expect(page.locator("[data-testid='user-menu-button']")).toBeVisible();
    await page.click("[data-testid='user-menu-button']");
    await expect(page.locator("#settings-menu-title")).toBeVisible(); // Wait for menu to open
    await expect(page.locator(`text=${email}`)).toBeVisible();
  });
});
