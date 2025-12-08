import { test, expect } from "@playwright/test";
import { waitForAppReady, clearBrowserStorage } from "../src/test-helpers";

test.describe("BizzWords Happy Path", () => {
  test.describe("Classic Game", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await waitForAppReady(page);
    });

    test("should load the main menu", async ({ page }) => {
      // Just verify the app loads properly
      await expect(page.locator("text=Master Business Lingo")).toBeVisible();
      await expect(page.locator("text=HR Words")).toBeVisible();
      await expect(page.locator("text=Project Management")).toBeVisible();
    });

    test("should complete a classic game from start to summary", async ({ page }) => {
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
            },
            {
              id: "3",
              term: "deadline",
              definition: "A date or time by which something must be completed",
              example: "The project deadline is tomorrow.",
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
            },
            {
              id: "2",
              term_translation: "prezentacja",
              definition_translation: "Formalna mowa skierowana do publiczności",
              example_translation: "Prezes wygłosił doskonałą prezentację."
            },
            {
              id: "3",
              term_translation: "termin",
              definition_translation: "Data lub czas, do którego coś musi zostać ukończone",
              example_translation: "Termin projektu przypada jutro."
            }
          ])
        });
      });

      // Wait for the app to load and verify we're on the main menu (already done in beforeEach)
      await expect(page.locator("text=Master Business Lingo")).toBeVisible();

      // Click on HR category to go to config screen
      await page.click("text=HR Words");

      // Wait for screen transition and verify we're on the config screen
      await page.waitForTimeout(1000); // Allow time for screen transition
      await expect(page.locator("text=Configure your session")).toBeVisible();

      // Select Classic mode (should already be selected by default)
      await page.click("text=Classic");

      // Keep default difficulty (All) - already selected

      // Keep default content source (Learn New Words) - already selected

      // Start the session
      await page.click("text=Start Session");

      // Dismiss round intro if shown
      try {
        await page.waitForSelector("button:has-text('Start Round')", { timeout: 2000 });
        await page.click("button:has-text('Start Round')");
        await page.waitForTimeout(500);
      } catch (e) {
        // Round intro might not be shown, continue
      }

      // Round 1: Recognition - Go through 3 cards (flashcards)
      for (let i = 0; i < 3; i++) {
        // Wait for card to be visible
        await expect(page.locator("[data-testid='flashcard-container']")).toBeVisible();

        // Click the card to flip it
        await page.click("[data-testid='flashcard-container']");

        // Wait for flip animation
        await page.waitForTimeout(600);

        // Click "Got It" button
        await page.click("text=Got It");

        // Wait for next card
        await page.waitForTimeout(500);
      }

      // Dismiss round intro for Round 2 if shown
      try {
        await page.waitForSelector("button:has-text('Start Round')", { timeout: 2000 });
        await page.click("button:has-text('Start Round')");
        await page.waitForTimeout(500);
      } catch (e) {
        // Round intro might not be shown, continue
      }

      // Round 2: Recall - Go through 3 cards (flashcards)
      for (let i = 0; i < 3; i++) {
        // Wait for card to be visible
        await expect(page.locator("[data-testid='flashcard-container']")).toBeVisible();

        // Click the card to flip it
        await page.click("[data-testid='flashcard-container']");

        // Wait for flip animation
        await page.waitForTimeout(600);

        // Click "Got It" button
        await page.click("text=Got It");

        // Wait for next card
        await page.waitForTimeout(500);
      }

      // Dismiss round intro for Round 3 if shown
      try {
        await page.waitForSelector("button:has-text('Start Round')", { timeout: 2000 });
        await page.click("button:has-text('Start Round')");
        await page.waitForTimeout(500);
      } catch (e) {
        // Round intro might not be shown, continue
      }

      // Round 3: Writing - Go through 3 cards (typing)
      for (let i = 0; i < 3; i++) {
        // Wait for typing card to be visible
        await expect(page.locator("text=Translate to English")).toBeVisible();

        // Wait for input to be enabled
        const input = page.locator("input[placeholder*='Type English word']");
        await expect(input).toBeEnabled();

        // Get the prompt text to determine the correct answer
        const promptElement = page.locator("text=Translate to English").locator("..").locator("h2");
        const promptText = await promptElement.textContent();

        // Map Polish words to English answers
        const answerMap: Record<string, string> = {
          "spotkanie": "meeting",
          "prezentacja": "presentation",
          "termin": "deadline"
        };

        const correctAnswer = answerMap[promptText?.trim() || ""] || "meeting";
        await input.fill(correctAnswer);

        // Click "Check Answer" button
        await page.click("text=Check Answer");

        // Wait for feedback and next card
        await page.waitForTimeout(1500);
      }

      // Verify we're on the summary screen
      await expect(page.locator("text=Session Complete!")).toBeVisible();

      // Verify summary content is displayed
      await expect(page.locator("text=Total Cards")).toBeVisible();
      await expect(page.locator("text=Needs Learning")).toBeVisible();

      // Verify action buttons are present
      await expect(page.locator("text=Start New Session")).toBeVisible();
      await expect(page.locator("text=Back to Home")).toBeVisible();
    });
  });
});
