import { test, expect } from "@playwright/test";
import { waitForAppReady, clearBrowserStorage, signInTestUser, ensureMenuClosed, signOutUser } from "../src/test-helpers";

test.describe("Settings Management Journey", () => {
  test("User Interacts with Hamburger Menu, Changes Theme, Switches Languages, and Navigates", async ({ page }) => {
    // Mock vocabulary data for testing
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

    // Step 1: Start as authenticated user
    await page.goto("/");
    await waitForAppReady(page);
    await clearBrowserStorage(page);

    // Sign in a test user properly using Firebase Auth Emulator
    await signInTestUser(page, "settings@example.com", "testpassword", "Settings Test User");

    // Wait for auth state to be updated and page to reload
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Master Business Lingo")).toBeVisible();

    // Verify user is authenticated - check that the hamburger SVG is not visible
    // Auth state check removed - hamburger icon is always visible, authenticated users show profile inside

    // Step 2: Open hamburger menu and explore settings
    // Close menu if it\'s already open
    await ensureMenuClosed(page);
    await page.click("[data-testid=\'user-menu-button\']");
    await expect(page.locator("#settings-menu-title")).toBeVisible();
    await expect(page.locator("text=Settings Test User")).toBeVisible();
    await expect(page.locator("text=settings@example.com")).toBeVisible();

    // Step 3: Test theme switching
    const themeToggleButton = page.locator("[data-testid=\'theme-toggle-button\']");

    // Initial theme should be \'system\' (or whatever default the app sets first)
    await expect(themeToggleButton).toHaveText("system");

    // Cycle to Light mode
    await themeToggleButton.click();
    await expect(themeToggleButton).toHaveText("light");

    // Cycle to Dark mode
    await themeToggleButton.click();
    await expect(themeToggleButton).toHaveText("dark");

    // Cycle back to System mode
    await themeToggleButton.click();
    await expect(themeToggleButton).toHaveText("system");

    // Step 4: Test language switching via settings menu
    await page.click("[data-testid=\'language-button-pl\']");
    await expect(page.locator("app-language-switcher span.md\\:block")).toHaveText("Polski");

    // Step 5: Test navigation to external links (About)
    await page.click("button:has-text(\'About\')"); // About button
    await expect(page.locator("#settings-menu-title")).not.toBeVisible(); // Menu should close

    // Note: In a real scenario, this would navigate to an about page
    // For E2E testing, we just verify the menu closes as expected

    // Step 6: Re-open menu and test Privacy Policy navigation
    await page.click("[data-testid=\'user-menu-button\']");
    await expect(page.locator("#settings-menu-title")).toBeVisible();

    await page.click("button:has-text(\'Privacy Policy\')"); // Privacy Policy button
    await expect(page.locator("#settings-menu-title")).not.toBeVisible(); // Menu should close

    // Step 7: Test language switching back to Spanish via header
    await page.click("app-language-switcher button");
    await expect(page.locator(".dropdown-menu")).toBeVisible();
    await page.click("button:has-text(\"Español\")");
    await expect(page.locator("app-language-switcher span.md\\:block")).toHaveText("Español");
    await expect(page.locator("text=Master Business Lingo")).toBeVisible();

    // Step 8: Test menu closing by clicking outside
    await page.click("[data-testid=\'user-menu-button\']");
    await expect(page.locator("#settings-menu-title")).toBeVisible();

    // Click backdrop to close it (try left side to avoid menu panel)
    // If on mobile (menu is full width), this might be intercepted, so fallback to close button
    try {
      await page.locator("[data-testid='settings-menu-backdrop']").click({ position: { x: 10, y: 10 }, timeout: 2000 });
    } catch (e) {
      // If backdrop is covered (mobile), click close button
      await page.click("[data-testid='settings-menu-close-button']");
    }
    await expect(page.locator("#settings-menu-title")).not.toBeVisible();

    // Step 9: Test menu persistence across page navigation simulation
    await page.click("[data-testid=\'user-menu-button\']");
    await expect(page.locator("#settings-menu-title")).toBeVisible();

    // Simulate navigation by clicking on a menu item that doesn\'t close the menu
    await themeToggleButton.click(); // Theme toggle doesn\'t close menu
    await expect(page.locator("#settings-menu-title")).toBeVisible(); // Should still be open

    // Step 10: Test logout functionality
    await page.click("[data-testid=\'signout-button\']");
    // Menu closes automatically on sign out
    await expect(page.locator("#settings-menu-title")).not.toBeVisible();

    // Re-open menu to verify sign out state
    await page.click("[data-testid=\'user-menu-button\']");
    await expect(page.locator("[data-testid=\'signin-button\']")).toBeVisible();
    await expect(page.locator("[data-testid=\'user-menu-button\']")).toBeVisible();

    // Step 11: Verify settings don\'t persist for anonymous users
    // Close menu first if it was opened in Step 10
    await ensureMenuClosed(page);
    await page.click("[data-testid=\'user-menu-button\']");
    await expect(page.locator("[data-testid=\'signin-button\']")).toBeVisible();
    await expect(page.locator("#settings-menu-title")).toBeVisible();
  });

  test("Anonymous User Access to Settings Menu", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await signOutUser(page);
    await clearBrowserStorage(page);
    await page.reload();
    await waitForAppReady(page);

    await expect(page.locator("text=Master Business Lingo")).toBeVisible();

    // Verify anonymous user sees sign-in option
    const menuButton = page.locator("[data-testid='user-menu-button']");
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Wait for animation
    await expect(page.locator("#settings-menu-title")).toBeVisible();
    await expect(page.locator("[data-testid='signin-button']")).toBeVisible();

    // Settings menu should be open for anonymous users too
    await expect(page.locator("#settings-menu-title")).toBeVisible();
    await expect(page.locator("text=Account")).toBeVisible();

    // Test that clicking Sign In opens auth modal
    await page.click("[data-testid=\'signin-button\']");
    await expect(page.locator("text=Continue with Google")).toBeVisible();
    await expect(page.locator("text=Continue with Email")).toBeVisible();
  });
});
