import { test, expect } from "@playwright/test";

test.describe("BizzWords", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test.describe("Game Setup", () => {
    test("should start a new game with default settings", async ({ page }) => {
      // TODO: Implement test
    });

    test("should start a new game with custom settings", async ({ page }) => {
      // TODO: Implement test
    });
  });

  test.describe("Classic Mode", () => {
    test.describe("Round 1 (Recognition)", () => {
      test('should mark word as "known" when "I know" is clicked', async ({ page }) => {
        // TODO: Implement test
      });

      test('should mark word as "unknown" when "I don\'t know" is clicked', async ({ page }) => {
        // TODO: Implement test
      });
    });

    test.describe("Round 2 (Recall)", () => {
      test('should mark word as "known" when "I know" is clicked', async ({ page }) => {
        // TODO: Implement test
      });

      test('should mark word as "unknown" when "I don\'t know" is clicked', async ({ page }) => {
        // TODO: Implement test
      });
    });

    test.describe("Round 3 (Writing)", () => {
      test("should mark word as a correct answer", async ({ page }) => {
        // TODO: Implement test
      });

      test("should mark word as an incorrect answer", async ({ page }) => {
        // TODO: Implement test
      });
    });
  });

  test.describe("Blitz Mode", () => {
    test("should complete a blitz game from start to summary", async ({ page }) => {
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

      // Navigate to the app
      await page.goto("/");

      // Wait for the app to load and verify we're on the main menu
      await expect(page.locator("text=Master Business Lingo")).toBeVisible();

      // Click on HR category
      await page.click("text=HR");

      // Select Blitz mode
      await page.click("text=Blitz");

      // Keep default difficulty (All)

      // Keep default content source (Learn New Words)

      // Start the session
      await page.click("text=Start Session");

      // Blitz mode consists of Recognition and Recall rounds only
      // Round 1: Recognition - Go through 3 cards (flashcards)
      for (let i = 0; i < 3; i++) {
        // Wait for card to be visible
        await expect(page.locator("[class*='perspective-1000']")).toBeVisible();

        // Click the card to flip it
        await page.click("[class*='perspective-1000']");

        // Wait for flip animation and button to be enabled
        await page.waitForTimeout(600);
        await expect(page.locator("#got-it")).toBeEnabled();

        // Click "Got It" button (fast blitz interaction)
        await page.click("#got-it");

        // Wait for next card
        await page.waitForTimeout(300); // Faster transitions in blitz
      }

      // Round 2: Recall - Go through 3 cards (flashcards)
      for (let i = 0; i < 3; i++) {
        // Wait for card to be visible
        await expect(page.locator("[class*='perspective-1000']")).toBeVisible();

        // Click the card to flip it
        await page.click("[class*='perspective-1000']");

        // Wait for flip animation
        await page.waitForTimeout(600);

        // Click "Got It" button
        await page.click("#got-it");

        // Wait for next card
        await page.waitForTimeout(300);
      }

      // Blitz mode should skip Writing round and go directly to summary
      // Verify we're on the summary screen
      await expect(page.locator("text=Session Complete!")).toBeVisible();

      // Verify summary content is displayed
      await expect(page.locator("text=Total Cards")).toBeVisible();
      await expect(page.locator("text=To Review")).toBeVisible();

      // Verify action buttons are present
      await expect(page.locator("text=Start New Session")).toBeVisible();
      await expect(page.locator("text=Back to Home")).toBeVisible();

      // Test Start New Session button
      await page.click("text=Start New Session");

      // Should navigate back to the game screen with same settings
      await expect(page.locator("[class*='perspective-1000']")).toBeVisible();

      // Test Back to Home button (need to complete another session first)
      // Since we clicked Start New Session, we're back in game, so complete it again quickly
      for (let i = 0; i < 3; i++) {
        await expect(page.locator("[class*='perspective-1000']")).toBeVisible();
        await page.click("[class*='perspective-1000']");
        await page.waitForTimeout(600);
        await page.click("#got-it");
        await page.waitForTimeout(300);
      }

      for (let i = 0; i < 3; i++) {
        await expect(page.locator("[class*='perspective-1000']")).toBeVisible();
        await page.click("[class*='perspective-1000']");
        await page.waitForTimeout(600);
        await page.click("#got-it");
        await page.waitForTimeout(300);
      }

      // Back on summary
      await expect(page.locator("text=Session Complete!")).toBeVisible();

      // Now test Back to Home
      await page.click("text=Back to Home");

      // Should navigate to main menu
      await expect(page.locator("text=Master Business Lingo")).toBeVisible();
    });
  });

  test.describe("Learning Mechanics", () => {
    test("should handle spaced repetition and failure recovery", async ({ page }) => {
      // Mock the English vocabulary data with more cards to test repetition
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
            },
            {
              id: "4",
              term: "budget",
              definition: "An estimate of income and expenditure for a set period of time",
              example: "The project budget was approved last week.",
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
            },
            {
              id: "3",
              term_translation: "termin",
              definition_translation: "Data lub czas, do którego coś musi zostać ukończone",
              example_translation: "Termin projektu przypada jutro."
            },
            {
              id: "4",
              term_translation: "budżet",
              definition_translation: "Szacunek dochodów i wydatków na ustalony okres czasu",
              example_translation: "Budżet projektu został zatwierdzony w zeszłym tygodniu."
            }
          ])
        });
      });

      // Navigate to the app
      await page.goto("/");

      // Wait for the app to load and verify we're on the main menu
      await expect(page.locator("text=Master Business Lingo")).toBeVisible();

      // Click on HR category
      await page.click("text=HR");

      // Select Classic mode (default)
      await page.click("text=Classic");

      // Keep default difficulty (All)
      // Keep default content source (Learn New Words)

      // Start the session
      await page.click("text=Start Session");

      // Round 1: Recognition - Test failure and re-queue behavior
      // Card 1: "meeting" - Mark as "Still Learning" to trigger failure handling
      await expect(page.locator("[class*='perspective-1000']")).toBeVisible();
      await page.click("[class*='perspective-1000']"); // Flip card
      await page.waitForTimeout(600);
      await page.click("#still-learning"); // Fail first card
      await page.waitForTimeout(500);

      // Card 2: "presentation" - Mark as "Got It"
      await expect(page.locator("[class*='perspective-1000']")).toBeVisible();
      await page.click("[class*='perspective-1000']"); // Flip card
      await page.waitForTimeout(600);
      await page.click("#got-it");
      await page.waitForTimeout(500);

      // Card 3: "deadline" - Mark as "Got It"
      await expect(page.locator("[class*='perspective-1000']")).toBeVisible();
      await page.click("[class*='perspective-1000']"); // Flip card
      await page.waitForTimeout(600);
      await page.click("#got-it");
      await page.waitForTimeout(500);

      // Card 4: "budget" - Mark as "Got It"
      await expect(page.locator("[class*='perspective-1000']")).toBeVisible();
      await page.click("[class*='perspective-1000']"); // Flip card
      await page.waitForTimeout(600);
      await page.click("#got-it");
      await page.waitForTimeout(500);

      // The failed "meeting" card should re-appear due to spaced repetition
      // It gets re-queued after 3 other cards (failure offset = 3)
      await expect(page.locator("[class*='perspective-1000']")).toBeVisible();
      await page.click("[class*='perspective-1000']"); // Flip card
      await page.waitForTimeout(600);
      await page.click("#got-it"); // Now get it right on retry
      await page.waitForTimeout(500);

      // Round 2: Recall - Fast-forward through all cards
      for (let i = 0; i < 4; i++) {
        await expect(page.locator("[class*='perspective-1000']")).toBeVisible();
        await page.click("[class*='perspective-1000']"); // Flip card
        await page.waitForTimeout(600);
        await page.click("#got-it");
        await page.waitForTimeout(500);
      }

      // Round 3: Writing - Complete all cards correctly
      for (let i = 0; i < 4; i++) {
        await expect(page.locator("text=Translate to English")).toBeVisible();

        // Get current prompt
        const currentPromptElement = page.locator("text=Translate to English").locator("..").locator("h2");
        const currentPrompt = await currentPromptElement.textContent();

        // Map to correct answer
        const answer = currentPrompt === "spotkanie" ? "meeting" :
                      currentPrompt === "prezentacja" ? "presentation" :
                      currentPrompt === "termin" ? "deadline" :
                      currentPrompt === "budżet" ? "budget" : "meeting";

        const typingInput = page.locator("input[placeholder*='Type English word']");
        await typingInput.fill(answer);
        await page.click("text=Check Answer");
        await page.waitForTimeout(1500);
      }

      // Verify we're on the summary screen
      await expect(page.locator("text=Session Complete!")).toBeVisible();

      // Verify the session completed successfully despite failures and retries
      await expect(page.locator("text=Start New Session")).toBeVisible();
      await expect(page.locator("text=Back to Home")).toBeVisible();
    });
  });
});
