/**
 * GymProLuxe — Auth Flow Demo Script
 *
 * Automated walkthrough of the Login & Register flow for screen recording.
 * Run with:  npx playwright test e2e-auth-demo.ts --headed
 *
 * Tips for recording:
 *   - Use OBS / QuickTime / Loom to capture the browser window
 *   - The script uses slow typing and pauses so viewers can follow along
 *   - Mobile viewport (390x844) is used for the PWA look
 */

import { test, expect, type Page } from '@playwright/test';

// ── Config ──────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:3000';
const TYPING_DELAY = 80; // ms per keystroke — looks natural on video
const SCENE_PAUSE = 2000; // pause between scenes so viewer can absorb
const SHORT_PAUSE = 1000;

const DEMO_USER = {
  firstName: 'John',
  lastName: 'Doe',
  email: `john.doe.${Date.now()}@example.com`,
  password: 'MyFitness@2026',
};

// ── Helpers ─────────────────────────────────────────────────────────

/** Slow-type into an input (clears existing value first). */
async function slowType(page: Page, selector: string, text: string) {
  const input = page.locator(selector);
  await input.click();
  await input.fill(''); // clear first
  await input.pressSequentially(text, { delay: TYPING_DELAY });
}

/** Pause so the viewer can read the screen. */
async function pause(ms = SCENE_PAUSE) {
  await new Promise((r) => setTimeout(r, ms));
}

// ── Test (demo script) ──────────────────────────────────────────────

test.use({
  viewport: { width: 390, height: 844 },
  colorScheme: 'light',
});

test('Auth flow demo for screen recording', async ({ page }) => {
  test.setTimeout(120_000); // 2 min — plenty of time for the slow demo

  // ────────────────────────────────────────────────────────────────
  // SCENE 1 — Landing Page
  // ────────────────────────────────────────────────────────────────
  await page.goto(BASE_URL);
  await expect(page.locator('text=GymProLuxe')).toBeVisible();
  await pause(SCENE_PAUSE);

  // ────────────────────────────────────────────────────────────────
  // SCENE 2 — Navigate to Register
  // ────────────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/register`);
  await expect(page.locator('text=Create an account')).toBeVisible();
  await pause(SCENE_PAUSE);

  // ────────────────────────────────────────────────────────────────
  // SCENE 3 — Trigger Validation Errors (submit empty form)
  // ────────────────────────────────────────────────────────────────
  await page.click('button:has-text("Create account")');
  await pause(SHORT_PAUSE);
  // Scroll down a bit so all errors are visible on mobile
  await page.evaluate(() => window.scrollBy(0, 100));
  await pause(SCENE_PAUSE);
  // Scroll back up
  await page.evaluate(() => window.scrollTo(0, 0));
  await pause(SHORT_PAUSE);

  // ────────────────────────────────────────────────────────────────
  // SCENE 4 — Fill in First Name & Last Name
  // ────────────────────────────────────────────────────────────────
  await slowType(page, '#firstName', DEMO_USER.firstName);
  await pause(SHORT_PAUSE);

  await slowType(page, '#lastName', DEMO_USER.lastName);
  await pause(SHORT_PAUSE);

  // ────────────────────────────────────────────────────────────────
  // SCENE 5 — Fill in Email
  // ────────────────────────────────────────────────────────────────
  await slowType(page, '#email', DEMO_USER.email);
  await pause(SHORT_PAUSE);

  // ────────────────────────────────────────────────────────────────
  // SCENE 6 — Password Strength Indicator Demo
  // ────────────────────────────────────────────────────────────────

  // 6a — Weak password
  await slowType(page, '#password', '123');
  await pause(SCENE_PAUSE); // let viewer see "Weak" bar

  // 6b — Medium password
  const pwdInput = page.locator('#password');
  await pwdInput.fill('');
  await pwdInput.pressSequentially('MyPass123', { delay: TYPING_DELAY });
  await pause(SCENE_PAUSE); // let viewer see "Medium" bar

  // 6c — Strong password
  await pwdInput.fill('');
  await pwdInput.pressSequentially(DEMO_USER.password, { delay: TYPING_DELAY });
  await pause(SCENE_PAUSE); // let viewer see "Strong" bar

  // ────────────────────────────────────────────────────────────────
  // SCENE 7 — Toggle Password Visibility
  // ────────────────────────────────────────────────────────────────
  // Click the eye icon to show password
  await page.locator('#password ~ button, button:near(#password)').first().click();
  await pause(SHORT_PAUSE);
  // Click again to hide
  await page.locator('#password ~ button, button:near(#password)').first().click();
  await pause(SHORT_PAUSE);

  // ────────────────────────────────────────────────────────────────
  // SCENE 8 — Submit Registration
  // ────────────────────────────────────────────────────────────────
  await page.click('button:has-text("Create account")');

  // Wait for either dashboard redirect or loading state
  await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {
    // If redirect doesn't happen, the API might not be running
    console.log('Note: Dashboard redirect did not occur — ensure the API is running on port 5000');
  });
  await pause(SCENE_PAUSE);

  // ────────────────────────────────────────────────────────────────
  // SCENE 9 — Dashboard (if we made it here)
  // ────────────────────────────────────────────────────────────────
  if (page.url().includes('/dashboard')) {
    // Let the page fully load (skeleton → real data)
    await pause(3000);

    // Scroll down slowly to show all dashboard content
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'smooth' }));
      await pause(800);
    }
    await pause(SHORT_PAUSE);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await pause(SHORT_PAUSE);

    // ──────────────────────────────────────────────────────────────
    // SCENE 10 — Logout
    // ──────────────────────────────────────────────────────────────
    const logoutBtn = page.locator('button:has-text("Logout"), button:has(svg.lucide-log-out)');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      // On mobile the text might be hidden; click the icon button
      await page.locator('svg.lucide-log-out').first().click();
    }
    await page.waitForURL('**/login', { timeout: 5000 }).catch(() => {});
    await pause(SCENE_PAUSE);
  }

  // ────────────────────────────────────────────────────────────────
  // SCENE 11 — Login Page
  // ────────────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/login`);
  await expect(page.locator('text=Welcome back')).toBeVisible();
  await pause(SCENE_PAUSE);

  // ────────────────────────────────────────────────────────────────
  // SCENE 12 — Login with wrong credentials (error demo)
  // ────────────────────────────────────────────────────────────────
  await slowType(page, '#email', 'wrong@example.com');
  await slowType(page, '#password', 'badpassword');
  await page.click('button:has-text("Sign in")');
  await pause(SCENE_PAUSE); // show error banner

  // ────────────────────────────────────────────────────────────────
  // SCENE 13 — Login with correct credentials
  // ────────────────────────────────────────────────────────────────
  await slowType(page, '#email', DEMO_USER.email);
  await slowType(page, '#password', DEMO_USER.password);
  await pause(SHORT_PAUSE);

  // Show the Remember Me checkbox (toggle it off then on)
  const rememberMe = page.locator('input[type="checkbox"]');
  await rememberMe.click(); // uncheck
  await pause(500);
  await rememberMe.click(); // re-check
  await pause(SHORT_PAUSE);

  // Click Sign in
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
  await pause(SCENE_PAUSE);

  // Quick dashboard view after login
  if (page.url().includes('/dashboard')) {
    await pause(3000);

    // ──────────────────────────────────────────────────────────────
    // SCENE 14 — Logout again for Forgot Password flow
    // ──────────────────────────────────────────────────────────────
    const logoutBtn2 = page.locator('button:has-text("Logout"), button:has(svg.lucide-log-out)');
    if (await logoutBtn2.isVisible()) {
      await logoutBtn2.click();
    } else {
      await page.locator('svg.lucide-log-out').first().click();
    }
    await page.waitForURL('**/login', { timeout: 5000 }).catch(() => {});
    await pause(SHORT_PAUSE);
  }

  // ────────────────────────────────────────────────────────────────
  // SCENE 15 — Forgot Password Flow
  // ────────────────────────────────────────────────────────────────
  await page.goto(`${BASE_URL}/login`);
  await pause(SHORT_PAUSE);

  // Click "Forgot password?" link
  await page.click('text=Forgot password?');
  await expect(page.locator('text=Forgot your password?')).toBeVisible();
  await pause(SCENE_PAUSE);

  // Type email and submit
  await slowType(page, '#email', DEMO_USER.email);
  await pause(SHORT_PAUSE);
  await page.click('button:has-text("Send reset link")');
  await pause(SCENE_PAUSE);

  // Show success state (or error if API not running)
  await pause(SCENE_PAUSE);

  // ────────────────────────────────────────────────────────────────
  // SCENE 16 — Back to Login (closing shot)
  // ────────────────────────────────────────────────────────────────
  const backBtn = page.locator('text=Back to sign in');
  if (await backBtn.isVisible()) {
    await backBtn.first().click();
    await pause(SCENE_PAUSE);
  }

  // Final pause — end of recording
  await pause(3000);
});
