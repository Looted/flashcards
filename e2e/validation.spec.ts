import { test, expect } from "@playwright/test";
import { waitForAppReady, clearBrowserStorage } from "../src/test-helpers";

test.describe("Validation Features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await clearBrowserStorage(page);
  });

  test("should accept acronym answers and normalized input", async ({ page }) => {
    // Mock vocabulary data with business terms that include acronyms
    await page.route("**/i18n/hr_en.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "1",
            term: "Corporate Social Responsibility",
            definition: "A company's commitment to ethical practices and social impact",
            example: "CSR initiatives help build brand reputation.",
            metadata: {
              difficulty: 2,
              tags: ["business", "acronym"]
            }
          },
          {
            id: "2",
            term: "Key Performance Indicator",
            definition: "A measurable value that demonstrates effectiveness",
            example: "Revenue growth is a common KPI.",
            metadata: {
              difficulty: 1,
              tags: ["business", "acronym"]
            }
          }
        ])
      });
    });

    // Mock the Polish translation data with acronyms
    await page.route("**/i18n/hr_pl.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "1",
            term_translation: "Społeczna Odpowiedzialność Biznesu",
            definition_translation: "Zaangażowanie firmy w praktyki etyczne i wpływ społeczny",
            example_translation: "Inicjatywy CSR pomagają budować reputację marki."
          },
          {
            id: "2",
            term_translation: "Kluczowy Wskaźnik Wydajności",
            definition_translation: "Mierzalna wartość, która demonstruje efektywność",
            example_translation: "Wzrost przychodów jest powszechnym KPI."
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

    // Skip through flashcard rounds to get to typing round
    // Round 1: Recognition
    for (let i = 0; i < 2; i++) {
      await expect(page.locator("[class*='perspective-1000']")).toBeVisible();
      await page.click("[class*='perspective-1000']"); // Flip card
      await page.waitForTimeout(600);
      await page.click("text=Got It");
      await page.waitForTimeout(500);
    }

    // Dismiss round intro for Round 2 if shown
    try {
      await page.waitForSelector("text=Start Round", { timeout: 2000 });
      await page.click("text=Start Round");
      await page.waitForTimeout(500);
    } catch (e) {
      // Round intro might not be shown, continue
    }

    // Round 2: Recall
    for (let i = 0; i < 2; i++) {
      await expect(page.locator("[class*='perspective-1000']")).toBeVisible();
      await page.click("[class*='perspective-1000']"); // Flip card
      await page.waitForTimeout(600);
      await page.click("text=Got It");
      await page.waitForTimeout(500);
    }

    // Dismiss round intro for Round 3 if shown
    try {
      await page.waitForSelector("text=Start Round", { timeout: 2000 });
      await page.click("text=Start Round");
      await page.waitForTimeout(500);
    } catch (e) {
      // Round intro might not be shown, continue
    }

    // Round 3: Writing - Test acronym and normalization features
    const input = page.locator("input[placeholder*='Type English word']");

    // Test each typing card with appropriate validation features
    for (let i = 0; i < 2; i++) {
      await expect(page.locator("text=Translate to English")).toBeVisible();
      await expect(input).toBeEnabled();

      const promptElement = page.locator("text=Translate to English").locator("..").locator("h2");
      const promptText = await promptElement.textContent();

      // Map Polish prompts to English answers with validation features
      if (promptText?.includes("Społeczna Odpowiedzialność Biznesu")) {
        // Test acronym input - user types "CSR" for "Corporate Social Responsibility"
        await input.fill("CSR");
      } else if (promptText?.includes("Kluczowy Wskaźnik Wydajności")) {
        // Test exact match first to verify basic functionality
        await input.fill("Key Performance Indicator");
      } else {
        // Fallback for unexpected terms - use exact match
        const answerMap: Record<string, string> = {
          "Społeczna Odpowiedzialność Biznesu": "Corporate Social Responsibility",
          "Kluczowy Wskaźnik Wydajności": "Key Performance Indicator"
        };
        const fallbackAnswer = answerMap[promptText?.trim() || ""] || "fallback";
        await input.fill(fallbackAnswer);
      }

      await page.click("text=Check Answer");

      // Should show success feedback for both test cases immediately
      const feedbackElement = page.locator(".mt-4.p-3.rounded-lg");
      await expect(feedbackElement).toBeVisible();
      const feedbackText = await feedbackElement.textContent();
      expect(feedbackText?.trim()).toContain("Correct");

      // Wait for the feedback delay to complete
      await page.waitForTimeout(1000);

      // Wait for next card or completion
      await page.waitForTimeout(1000);
    }

    // Complete the session
    await page.waitForTimeout(1500);
    await expect(page.locator("text=Session Complete!")).toBeVisible();
  });
});
