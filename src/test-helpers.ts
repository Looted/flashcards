import { Page, expect } from '@playwright/test';
import { start } from 'node:repl';

// Extend Window interface for Firebase
declare global {
  interface Window {
    firebase?: any;
    authService?: any;
  }
}

const FIREBASE_AUTH_URL = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts';
const SIGN_UP_ENDPOINT = `${FIREBASE_AUTH_URL}:signUp?key=demo-key`;
const SIGN_IN_ENDPOINT = `${FIREBASE_AUTH_URL}:signInWithPassword?key=demo-key`;

/**
 * Helper functions for E2E tests
 */

/**
 * Signs in a test user using Firebase Auth Emulator REST API
 * @param page Playwright page instance
 * @param email User email
 * @param password User password
 * @param displayName Optional display name
 * @returns Promise that resolves when user is signed in
 */
export async function signInTestUser(
  page: Page,
  email: string,
  password: string,
  displayName?: string
): Promise<void> {
  try {
    // First, create the user in the emulator (ignore if already exists)
    const createResponse = await fetch(SIGN_UP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        displayName: displayName || email.split('@')[0],
        photoUrl: 'https://lh3.googleusercontent.com/a/test-photo.jpg',
        returnSecureToken: true,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.warn(`User creation failed (may already exist): ${error}`);
    }

    // Now sign in the user through the UI by clicking the sign-in button
    await page.click("[data-testid='user-menu-button']");
    // Wait for settings menu to be visible
    await expect(page.locator("#settings-menu-title")).toBeVisible();
    await page.waitForSelector("[data-testid='signin-button']", { timeout: 10000 });
    await page.click("[data-testid='signin-button']");
    await page.click("text=Continue with Email");

    await page.fill("[data-testid='email-input']", email);
    await page.fill("[data-testid='password-input']", password);
    await page.click("[data-testid='submit-button']");

    // Wait for auth state to be updated - wait for the sign-in modal to disappear
    await expect(page.locator("[data-testid='email-input']")).toBeHidden({ timeout: 10000 });

  } catch (error) {
    console.error('Failed to sign in test user:', error);
    throw error;
  }
}

/**
 * Signs out the current user
 * @param page Playwright page instance
 */
export async function signOutUser(page: Page): Promise<void> {
  await page.evaluate(() => {
    if (window.firebase && window.firebase.auth) {
      return window.firebase.auth().signOut();
    }
    // Also try via authService if exposed
    if ((window as any).authService) {
      return (window as any).authService.signOut();
    }
  });

  // Wait for sign out to reflect in state
  await page.waitForFunction(() => {
     const service = (window as any).authService;
     return service ? !service.isAuthenticated() : true;
  });
}

/**
 * Clears browser storage safely
 * @param page Playwright page instance
 */
export async function clearBrowserStorage(page: Page): Promise<void> {
  // Clear cookies first
  const context = page.context();
  await context.clearCookies();

  // Only clear storage if page is already loaded and we can access it
  try {
    await page.evaluate(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    });
  } catch (error) {
    // If we can't access storage, it's probably because the page hasn't loaded yet
    // This is fine - the page will initialize with empty storage
    console.warn('Could not clear browser storage - page may not be fully loaded yet');
  }
}

/**
 * Waits for the Angular app to be fully loaded and ready
 * @param page Playwright page instance
 */
export async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForSelector('text=Master Business Lingo', { timeout: 30000 });
  // Ensure the loading indicator is gone if any
  const spinner = page.locator('.loading-spinner');
  if (await spinner.count() > 0) {
    await expect(spinner).toBeHidden();
  }
}

/**
 * Creates a test user via Firebase Auth Emulator REST API
 * This is useful for setting up test data without going through the UI
 * @param email User email
 * @param password User password
 * @param displayName Optional display name
 */
export async function createTestUser(
  email: string,
  password: string,
  displayName?: string
): Promise<void> {
  try {
    const response = await fetch(SIGN_UP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        displayName: displayName || email.split('@')[0],
        returnSecureToken: true,
      }),
    });

    if (!response.ok && !response.status.toString().startsWith('4')) {
      // 4xx errors might mean user already exists, which is fine
      throw new Error(`Failed to create test user: ${await response.text()}`);
    }
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw error;
  }
}

/**
 * Authenticates a user via Firebase Auth Emulator REST API and sets the auth state in the browser
 * This creates a real authenticated session that persists across page reloads
 * @param page Playwright page instance
 * @param email User email
 * @param password User password (default: "password123")
 * @param displayName User display name
 */
export async function mockFirebaseAuth(
  page: Page,
  email: string,
  password: string = "password123",
  displayName?: string
): Promise<void> {
  try {
    // First, try to create the user (ignore if already exists)
    const signUpResponse = await fetch(SIGN_UP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        displayName: displayName || email.split('@')[0],
        returnSecureToken: true,
      }),
    });

    if (!signUpResponse.ok) {
      // User might already exist, try to sign in
      const signInResponse = await fetch(SIGN_IN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      });

      if (!signInResponse.ok) {
        throw new Error(`Failed to sign in: ${await signInResponse.text()}`);
      }
    }

    // Authenticate using the exposed AuthService in the browser
    await page.evaluate(async ({ email, password }) => {
      const authService = (window as any).authService;
      if (!authService) {
        throw new Error('AuthService not found on window. Ensure it is exposed in constructor.');
      }

      await authService.signInWithEmail(email, password);
    }, { email, password });

    // Wait for the UI to update
    await page.waitForFunction(() => {
        const service = (window as any).authService;
        return service && service.isAuthenticated();
    });

  } catch (error) {
    console.error('Failed to mock Firebase auth:', error);
    throw error;
  }
}


/**
 * Helper function to dismiss round intro screen if it appears
 */
export async function dismissRoundIntro(page: Page): Promise<void> {
  try {
    // Look for the round intro card first
    const introCard = page.locator('.round-intro-card');
    // Check visibility with a timeout (wait for game   to init)
    if (await introCard.isVisible({ timeout: 5000 })) {
      console.log('Round intro card is visible, dismissing it');
         // Click the continue button (Start Round)
         const startButton = introCard.getByRole('button', { name: /Start Round .*/gm })
         await expect(startButton).toBeVisible({timeout: 5000 });
         await startButton.click();
         await expect(introCard).toBeHidden({ timeout: 5000 });
    }
  } catch (e) {
      // Ignore if not found - assume we're already past it
      console.log('Round intro not found or already dismissed');
  }
}

/**
 * Helper function to play through a complete classic game (3 rounds)
 * @param page - Playwright page object
 * @param expectedAnswer - The English translation expected in Round 3
 */
export async function playCompleteClassicGame(page: Page, expectedAnswer: string = "greeting"): Promise<void> {

  // Round 1: Recognition (English -> Translation)
  await dismissRoundIntro(page);

  // Use data-testid for more reliable selection and increased timeout for robustness
  const flashcard = page.locator("[data-testid='flashcard-container']");
  await expect(flashcard).toBeVisible({ timeout: 30000 });
  await flashcard.click();

  // Wait for "Got It" button to be actionable (replaces arbitrary wait)
  const gotItButton = page.locator("text=Got It");
  await expect(gotItButton).toBeVisible();
  await gotItButton.click();

  // Round 1 complete

  // Round 2: Recall (Translation -> English)
  await dismissRoundIntro(page);

  const flashcard2 = page.locator("[data-testid='flashcard-container']");
  await expect(flashcard2).toBeVisible({ timeout: 30000 });
  await flashcard2.click();

  const gotItButton2 = page.locator("text=Got It");
  await expect(gotItButton2).toBeVisible();
  await gotItButton2.click();

  // Round 2 complete

  // Round 3: Writing (Translation -> English)
  await dismissRoundIntro(page);

  // Use generic selector to find ANY input in the card
  const input = page.locator("app-typing-card input");
  await expect(input).toBeVisible({ timeout: 5000 });

  await input.fill(expectedAnswer);
  await page.click("text=Check Answer");

  // After checking answer, there might be feedback - click Continue/Next if present
  try {
    const continueButton = page.locator("button:has-text('Continue'), button:has-text('Next'), button:has-text('Finish')");
    // Wait for it to be visible
    await expect(continueButton).toBeVisible({ timeout: 2000 });
    await continueButton.click();
  } catch (e) {
    // No Continue button found, proceeding...
  }

  // Wait for summary screen to appear
  await expect(page.locator("text=Session Complete!")).toBeVisible({ timeout: 15000 });
}

/**
 * Helper function to start a game session
 */
export async function startGameSession(page: Page, category: string = "HR", mode: string = "Classic"): Promise<void> {
  // Wait for the category to be visible and stable before clicking
  const categoryLocator = page.locator(`text=${category}`);
  await expect(categoryLocator).toBeVisible();
  await categoryLocator.click();
  await page.click(`text=${mode}`);
  await page.click("text=Start Session");
}

/**
 * Helper function to ensure the settings menu is closed
 * @param page Playwright page instance
 */
export async function ensureMenuClosed(page: Page): Promise<void> {
  const menuButton = page.locator("[data-testid='user-menu-button']");
  const closeButton = page.locator("[data-testid='settings-menu-close-button']");
  const backdrop = page.locator("[data-testid='settings-menu-backdrop']");
  const emailModalClose = page.locator("button[aria-label='Close modal']");

  // Check for email modal first (it might be on top of the menu)
  if (await emailModalClose.isVisible()) {
    try {
      await emailModalClose.click({ timeout: 2000 });
      await expect(emailModalClose).toBeHidden();
    } catch (e) {
    }
  }

  // Check if menu is visible (by checking close button or backdrop) or expanded
  const isMenuVisible = await closeButton.isVisible() || await backdrop.isVisible();
  const isExpanded = await menuButton.getAttribute('aria-expanded');

  if (isMenuVisible || isExpanded === 'true') {

    // 1. Try clicking the close button inside the menu (most reliable)
    try {
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(closeButton).toBeHidden();
        return;
      }
    } catch (e) {
      // Ignore
    }

    // 2. Try clicking the backdrop
    try {
      if (await backdrop.isVisible()) {
        await backdrop.click();
        await expect(backdrop).toBeHidden();
        return;
      }
    } catch (e) {
      // Ignore
    }
  }
}
