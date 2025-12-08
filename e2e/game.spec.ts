import { test, expect } from "@playwright/test";
import { waitForAppReady, clearBrowserStorage } from "../src/test-helpers";

test.describe("BizzWords", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await clearBrowserStorage(page);
  });

  test.describe("Learning Mechanics", () => {
    test("should display english definition on flip", async ({ page }) => {
      // Mock the English vocabulary data
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
              metadata: {
                difficulty: 1,
                tags: ["business"]
              }
            }
          ])
        });
      });

      // Mock the Polish translation data
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

      // Already on main menu from beforeEach
      await expect(page.locator("text=Master Business Lingo")).toBeVisible();

      // Click on HR category
      await page.click("text=HR Words");

      // Select Classic mode
      await page.click("text=Classic");

      // Start the session
      await page.click("text=Start Session");

      // Dismiss round intro if shown
      try {
        await page.waitForSelector("text=Start Round", { timeout: 2000 });
        await page.click("text=Start Round");
        await page.waitForTimeout(500);
      } catch (e) {
        // Round intro might not be shown, continue
      }

      // First card should be visible
      await expect(page.locator("[class*='perspective-1000']")).toBeVisible();

      // Wait for card content to load
      await page.waitForTimeout(1000);

      // Flip the card
      await page.click("[class*='perspective-1000']");
      await page.waitForTimeout(600);

      // Expect text "English Definition" (the label) to be visible
      await expect(page.locator("text=English Definition")).toBeVisible();
    });

    test("should permanently skip cards that are skipped", async ({ page }) => {
      // Mock the English vocabulary data
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
              metadata: {
                difficulty: 1,
                tags: ["business"]
              }
            },
            {
              id: "2",
              term: "presentation",
              definition: "A formal talk given to an audience",
              example: "The CEO gave an excellent presentation.",
              metadata: {
                difficulty: 2,
                tags: ["business"]
              }
            }
          ])
        });
      });

      // Mock the Polish translation data
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
            },
            {
              id: "2",
              term_translation: "prezentacja",
              definition_translation: "Formalna mowa skierowana do publiczności",
              example_translation: "Prezes wygłosił doskonałą prezentację."
            }
          ])
        });
      });

      // Already on main menu from beforeEach
      await expect(page.locator("text=Master Business Lingo")).toBeVisible();

      // Click on HR category
      await page.click("text=HR Words");

      // Select Classic mode
      await page.click("text=Classic");

      // Start the session
      await page.click("text=Start Session");

      // Dismiss round intro if shown
      try {
        await page.waitForSelector("text=Start Round", { timeout: 2000 });
        await page.click("text=Start Round");
        await page.waitForTimeout(500);
      } catch (e) {
        // Round intro might not be shown, continue
      }

      // First card should be visible
      await expect(page.locator("[class*='perspective-1000']")).toBeVisible();

      // Wait for card content to load
      await page.waitForTimeout(1000);

      // Get the front text of the first card
      const skippedCardText = await page.locator("[class*='perspective-1000'] h2").first().textContent();

      // Flip the card
      await page.click("[class*='perspective-1000']");
      await page.waitForTimeout(600);

      // Skip the first card
      await page.click("text=Skip Card");
      await page.waitForTimeout(500);

      // Verify next card is different from skipped card
      const nextCardText = await page.locator("[class*='perspective-1000'] h2").first().textContent();
      expect(nextCardText?.trim()).not.toBe(skippedCardText?.trim());

      // Complete the remaining card
      await expect(page.locator("[class*='perspective-1000']")).toBeVisible();
      await page.click("[class*='perspective-1000']"); // Flip card
      await page.waitForTimeout(600);
      await page.click("text=Got It");
      await page.waitForTimeout(500);

      // Should advance to next round automatically
      await page.waitForTimeout(1000);

      // Dismiss round intro for Round 2 if shown
      try {
        await page.waitForSelector("text=Start Round", { timeout: 2000 });
        await page.click("text=Start Round");
        await page.waitForTimeout(500);
      } catch (e) {
        // Round intro might not be shown, continue
      }

      // In round 2, the skipped card should not appear
      // We should only see the non-skipped card
      await expect(page.locator("[class*='perspective-1000']")).toBeVisible();

      // Get the current card text
      const round2CardText = await page.locator("[class*='perspective-1000'] h2").first().textContent();

      // The card in round 2 should NOT be the skipped card
      expect(round2CardText?.trim()).not.toBe(skippedCardText?.trim());

      // Complete round 2
      await page.click("[class*='perspective-1000']"); // Flip card
      await page.waitForTimeout(600);
      await page.click("text=Got It");
      await page.waitForTimeout(500);

      // Should advance to round 3 (writing)
      await page.waitForTimeout(1000);

      // Dismiss round intro for Round 3 if shown
      try {
        await page.waitForSelector("text=Start Round", { timeout: 2000 });
        await page.click("text=Start Round");
        await page.waitForTimeout(500);
      } catch (e) {
        // Round intro might not be shown, continue
      }

      // In round 3, verify the skipped card's translation is not shown
      const skippedTranslation = skippedCardText?.trim() === "meeting" ? "spotkanie" : "prezentacja";
      await expect(page.getByText(skippedTranslation)).not.toBeVisible();

      // Complete the writing round
      await expect(page.locator("text=Translate to English")).toBeVisible();

      // Get the prompt
      const currentPromptElement = page.locator("text=Translate to English").locator("..").locator("h2");
      const currentPrompt = await currentPromptElement.textContent();

      // Map to correct answer
      const answer = currentPrompt === "prezentacja" ? "presentation" : "meeting";

      const typingInput = page.locator("input[placeholder*='Type English word']");
      await typingInput.fill(answer);
      await page.click("text=Check Answer");
      await page.waitForTimeout(1500);

      // Verify we're on the summary screen
      await expect(page.locator("text=Session Complete!")).toBeVisible();
    });
  });
});
