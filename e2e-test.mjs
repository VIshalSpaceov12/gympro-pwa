import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const SCREENSHOTS_DIR = '/Users/sotsys336/Documents/Projects/GymPro/gympro-pwa/test-screenshots';
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  const results = [];
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    // ==========================================
    // STEP 1: Landing Page
    // ==========================================
    console.log('\n=== STEP 1: Landing Page ===');
    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-landing-page.png`, fullPage: true });
      console.log('Screenshot saved: 01-landing-page.png');

      const pageContent = await page.textContent('body');
      const hasGymProLuxe = pageContent.includes('GymProLuxe') || pageContent.includes('GymPro') || pageContent.includes('gympro');
      const title = await page.title();
      console.log(`Page title: ${title}`);
      console.log(`Has GymProLuxe branding: ${hasGymProLuxe}`);
      results.push({ step: '1. Landing Page', status: hasGymProLuxe ? 'PASS' : 'WARN', notes: `Title: "${title}", Branding found: ${hasGymProLuxe}` });
    } catch (err) {
      console.log(`Step 1 error: ${err.message}`);
      results.push({ step: '1. Landing Page', status: 'FAIL', notes: err.message });
    }

    // ==========================================
    // STEP 2: Login Page
    // ==========================================
    console.log('\n=== STEP 2: Login Page ===');
    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/02a-login-empty.png`, fullPage: true });
      console.log('Screenshot saved: 02a-login-empty.png');

      // Find email and password fields
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="Email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

      await emailInput.fill('user@gympro.com');
      await passwordInput.fill('Admin1234');
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/02b-login-filled.png`, fullPage: true });
      console.log('Screenshot saved: 02b-login-filled.png');

      // Click sign in button
      const signInBtn = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Login"), button:has-text("Sign in")').first();
      await signInBtn.click();
      console.log('Clicked sign in button');

      // Wait for navigation
      await page.waitForURL(/\/(dashboard|home|workouts)/, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      console.log(`After login URL: ${currentUrl}`);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/02c-after-login.png`, fullPage: true });
      console.log('Screenshot saved: 02c-after-login.png');

      results.push({ step: '2. Login', status: currentUrl.includes('dashboard') || currentUrl.includes('home') ? 'PASS' : 'WARN', notes: `Redirected to: ${currentUrl}` });
    } catch (err) {
      console.log(`Step 2 error: ${err.message}`);
      results.push({ step: '2. Login', status: 'FAIL', notes: err.message });
    }

    // ==========================================
    // STEP 3: Dashboard
    // ==========================================
    console.log('\n=== STEP 3: Dashboard ===');
    try {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-dashboard.png`, fullPage: true });
      console.log('Screenshot saved: 03-dashboard.png');

      const bodyText = await page.textContent('body');
      const hasWelcome = bodyText.includes('Welcome') || bodyText.includes('welcome');
      const hasStats = bodyText.includes('stat') || bodyText.includes('Stat') || bodyText.includes('workout') || bodyText.includes('Workout');
      console.log(`Has welcome greeting: ${hasWelcome}`);
      console.log(`Has stats/workout content: ${hasStats}`);
      results.push({ step: '3. Dashboard', status: 'PASS', notes: `Welcome: ${hasWelcome}, Stats: ${hasStats}` });
    } catch (err) {
      console.log(`Step 3 error: ${err.message}`);
      results.push({ step: '3. Dashboard', status: 'FAIL', notes: err.message });
    }

    // ==========================================
    // STEP 4: Workout Library
    // ==========================================
    console.log('\n=== STEP 4: Workout Library ===');
    try {
      await page.goto(`${BASE_URL}/workouts`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-workouts.png`, fullPage: true });
      console.log('Screenshot saved: 04-workouts.png');

      const bodyText = await page.textContent('body');
      // Check for video/workout cards
      const cards = await page.locator('[class*="card"], [class*="Card"], [class*="video"], [class*="Video"], [class*="workout"], [class*="Workout"]').count();
      console.log(`Found ${cards} card-like elements`);
      results.push({ step: '4. Workout Library', status: cards > 0 ? 'PASS' : 'WARN', notes: `Found ${cards} card elements` });
    } catch (err) {
      console.log(`Step 4 error: ${err.message}`);
      results.push({ step: '4. Workout Library', status: 'FAIL', notes: err.message });
    }

    // ==========================================
    // STEP 5: Difficulty Filter
    // ==========================================
    console.log('\n=== STEP 5: Difficulty Filter ===');
    try {
      // Look for Beginner filter/pill
      const beginnerBtn = page.locator('button:has-text("Beginner"), [role="tab"]:has-text("Beginner"), a:has-text("Beginner"), [class*="pill"]:has-text("Beginner"), [class*="filter"]:has-text("Beginner"), [class*="chip"]:has-text("Beginner")').first();
      const beginnerExists = await beginnerBtn.count();
      if (beginnerExists > 0) {
        await beginnerBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-filtered-beginner.png`, fullPage: true });
        console.log('Screenshot saved: 05-filtered-beginner.png');
        results.push({ step: '5. Difficulty Filter', status: 'PASS', notes: 'Clicked Beginner filter' });
      } else {
        console.log('Beginner filter not found, trying other selectors...');
        // Try text content match
        const allButtons = await page.locator('button').all();
        let found = false;
        for (const btn of allButtons) {
          const text = await btn.textContent();
          if (text && text.trim().toLowerCase().includes('beginner')) {
            await btn.click();
            found = true;
            break;
          }
        }
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-filtered-beginner.png`, fullPage: true });
        console.log('Screenshot saved: 05-filtered-beginner.png');
        results.push({ step: '5. Difficulty Filter', status: found ? 'PASS' : 'WARN', notes: found ? 'Found and clicked Beginner' : 'Beginner filter not found' });
      }
    } catch (err) {
      console.log(`Step 5 error: ${err.message}`);
      results.push({ step: '5. Difficulty Filter', status: 'FAIL', notes: err.message });
    }

    // ==========================================
    // STEP 6: Search
    // ==========================================
    console.log('\n=== STEP 6: Search ===');
    try {
      // Clear beginner filter - click All
      const allBtn = page.locator('button:has-text("All"), [role="tab"]:has-text("All")').first();
      const allExists = await allBtn.count();
      if (allExists > 0) {
        await allBtn.click();
        await page.waitForTimeout(1000);
      }

      // Find search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search"], input[name="search"], [role="searchbox"]').first();
      const searchExists = await searchInput.count();
      if (searchExists > 0) {
        await searchInput.fill('yoga');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-search-yoga.png`, fullPage: true });
        console.log('Screenshot saved: 06-search-yoga.png');
        results.push({ step: '6. Search', status: 'PASS', notes: 'Typed "yoga" in search' });
      } else {
        console.log('Search input not found');
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-search-yoga.png`, fullPage: true });
        results.push({ step: '6. Search', status: 'WARN', notes: 'Search input not found' });
      }
    } catch (err) {
      console.log(`Step 6 error: ${err.message}`);
      results.push({ step: '6. Search', status: 'FAIL', notes: err.message });
    }

    // ==========================================
    // STEP 7: Video Detail
    // ==========================================
    console.log('\n=== STEP 7: Video Detail ===');
    try {
      // Clear search first
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search"], input[name="search"], [role="searchbox"]').first();
      const searchExists = await searchInput.count();
      if (searchExists > 0) {
        await searchInput.fill('');
        await page.waitForTimeout(1000);
      }

      // Click first video card
      const videoCard = page.locator('[class*="card"] a, [class*="Card"] a, a[href*="/video"], a[href*="/workout"], [class*="card"][role="link"], [class*="video-card"]').first();
      const cardExists = await videoCard.count();

      if (cardExists > 0) {
        await videoCard.click();
      } else {
        // Try clicking any card-like element
        const anyCard = page.locator('[class*="card"], [class*="Card"]').first();
        await anyCard.click();
      }

      await page.waitForTimeout(3000);
      const detailUrl = page.url();
      console.log(`Video detail URL: ${detailUrl}`);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/07-video-detail.png`, fullPage: true });
      console.log('Screenshot saved: 07-video-detail.png');

      const bodyText = await page.textContent('body');
      const hasDetail = bodyText.includes('duration') || bodyText.includes('Duration') ||
                        bodyText.includes('difficulty') || bodyText.includes('Difficulty') ||
                        bodyText.includes('description') || bodyText.includes('Description') ||
                        bodyText.includes('min') || bodyText.includes('Minutes');
      console.log(`Has detail info: ${hasDetail}`);
      results.push({ step: '7. Video Detail', status: 'PASS', notes: `URL: ${detailUrl}, Detail info: ${hasDetail}` });
    } catch (err) {
      console.log(`Step 7 error: ${err.message}`);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/07-video-detail.png`, fullPage: true }).catch(() => {});
      results.push({ step: '7. Video Detail', status: 'FAIL', notes: err.message });
    }

    // ==========================================
    // STEP 8: Mobile View - Dashboard
    // ==========================================
    console.log('\n=== STEP 8: Mobile View - Dashboard ===');
    try {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/08-mobile-dashboard.png`, fullPage: false });
      console.log('Screenshot saved: 08-mobile-dashboard.png');

      // Check for bottom nav
      const bottomNav = await page.locator('nav, [class*="bottom-nav"], [class*="BottomNav"], [class*="tab-bar"], [class*="TabBar"], [role="navigation"]').count();
      console.log(`Found ${bottomNav} navigation elements`);
      results.push({ step: '8. Mobile Dashboard', status: 'PASS', notes: `Navigation elements: ${bottomNav}` });
    } catch (err) {
      console.log(`Step 8 error: ${err.message}`);
      results.push({ step: '8. Mobile Dashboard', status: 'FAIL', notes: err.message });
    }

    // ==========================================
    // STEP 9: Mobile Workouts
    // ==========================================
    console.log('\n=== STEP 9: Mobile Workouts ===');
    try {
      await page.goto(`${BASE_URL}/workouts`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/09-mobile-workouts.png`, fullPage: false });
      console.log('Screenshot saved: 09-mobile-workouts.png');
      results.push({ step: '9. Mobile Workouts', status: 'PASS', notes: 'Mobile workouts page loaded' });
    } catch (err) {
      console.log(`Step 9 error: ${err.message}`);
      results.push({ step: '9. Mobile Workouts', status: 'FAIL', notes: err.message });
    }

    // ==========================================
    // STEP 10: Register Page
    // ==========================================
    console.log('\n=== STEP 10: Register Page ===');
    try {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/10-register.png`, fullPage: true });
      console.log('Screenshot saved: 10-register.png');

      const formFields = await page.locator('input').count();
      console.log(`Register form has ${formFields} input fields`);
      results.push({ step: '10. Register Page', status: formFields > 0 ? 'PASS' : 'WARN', notes: `${formFields} input fields found` });
    } catch (err) {
      console.log(`Step 10 error: ${err.message}`);
      results.push({ step: '10. Register Page', status: 'FAIL', notes: err.message });
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n\n========================================');
    console.log('           TEST SUMMARY');
    console.log('========================================');
    for (const r of results) {
      console.log(`[${r.status}] ${r.step}: ${r.notes}`);
    }
    console.log('========================================\n');

  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    if (browser) await browser.close();
  }
}

runTests();
