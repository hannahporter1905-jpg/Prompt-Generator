import { chromium } from 'playwright';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function findButton(page, selectors, timeoutMs = 5000) {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      await el.waitFor({ state: 'visible', timeout: timeoutMs });
      console.log(`  Found button with selector: ${sel}`);
      return el;
    } catch {
      // try next selector
    }
  }
  return null;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Log all browser console messages (errors, logs, warnings)
  page.on('console', msg => console.log(`  [BROWSER] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.log(`  [PAGE ERROR] ${err.message}`));

  // --- Step 1: Navigate ---
  console.log('\n=== Step 1: Navigate to http://localhost:5173 ===');
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.log(`  networkidle timed out or errored: ${e.message}`);
    console.log('  Trying domcontentloaded fallback...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
  }

  // Wait 3 seconds as instructed
  console.log('  Waiting 3 seconds...');
  await sleep(3000);

  // --- Step 2: Before screenshot ---
  console.log('\n=== Step 2: Taking BEFORE screenshot ===');
  const beforePath = 'C:/Users/User/Prompt-Generator/test-before-library.png';
  await page.screenshot({ path: beforePath, fullPage: false });
  console.log(`  Saved: ${beforePath}`);

  // --- Step 3: Find and click "Image Library" button ---
  console.log('\n=== Step 3: Looking for "Image Library" button ===');
  const libSelectors = [
    'button:has-text("Image Library")',
    'a:has-text("Image Library")',
    'text=Image Library',
    '[aria-label="Image Library"]',
    '[title="Image Library"]',
    'span:has-text("Image Library")',
  ];

  const libButton = await findButton(page, libSelectors);

  if (!libButton) {
    console.log('  ERROR: Could not find "Image Library" button.');
    // Dump all interactive element texts for debugging
    const allButtons = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button, a, [role="button"]'))
        .map(el => el.innerText?.trim() || el.getAttribute('aria-label') || el.id)
        .filter(Boolean)
    );
    console.log('  All clickable elements found:', allButtons.join(' | '));
    await browser.close();
    return;
  }

  await libButton.click();
  console.log('  Clicked "Image Library" button.');

  // --- Step 4: Wait 15 seconds for library to open + Supabase sync ---
  console.log('\n=== Step 4: Waiting 15 seconds for Supabase sync to complete... ===');
  for (let i = 1; i <= 15; i++) {
    await sleep(1000);
    process.stdout.write(`  ${i}s... `);
    if (i % 5 === 0) process.stdout.write('\n');
  }
  console.log('\n  15 seconds elapsed.');

  // --- Step 5: Inspect the library state ---
  console.log('\n=== Step 5: Inspecting library state ===');
  const libraryState = await page.evaluate(() => {
    // Count image cards / thumbnails
    const allImgs = document.querySelectorAll('img');
    const imageCards = document.querySelectorAll('[class*="card"], [class*="Card"], [class*="grid"] > div, [class*="library"] img');
    const emptyState = document.querySelector('[class*="empty"], [class*="Empty"]');
    const emptyStateText = document.body.innerText.includes('No images yet')
      || document.body.innerText.includes('no images')
      || document.body.innerText.includes('No images');
    const errorMessages = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"]'))
      .map(el => el.innerText?.trim())
      .filter(Boolean);
    const visibleText = document.body.innerText.substring(0, 2000);

    return {
      total_imgs: allImgs.length,
      img_srcs: Array.from(allImgs).slice(0, 10).map(i => i.src),
      image_cards_count: imageCards.length,
      has_empty_state_element: !!emptyState,
      body_says_no_images: emptyStateText,
      error_messages: errorMessages,
      page_text_sample: visibleText,
    };
  });

  console.log(`  Total <img> elements: ${libraryState.total_imgs}`);
  console.log(`  Image card elements: ${libraryState.image_cards_count}`);
  console.log(`  Empty state element visible: ${libraryState.has_empty_state_element}`);
  console.log(`  Page says "No images yet": ${libraryState.body_says_no_images}`);
  console.log(`  Error messages: ${libraryState.error_messages.join(' | ') || 'none'}`);
  console.log(`  First 10 img srcs: ${libraryState.img_srcs.join('\n    ')}`);
  console.log(`\n  Page text sample:\n  ${libraryState.page_text_sample.replace(/\n/g, '\n  ')}`);

  // --- Step 6: After screenshot ---
  console.log('\n=== Step 6: Taking AFTER screenshot ===');
  const afterPath = 'C:/Users/User/Prompt-Generator/test-after-library.png';
  await page.screenshot({ path: afterPath, fullPage: false });
  console.log(`  Saved: ${afterPath}`);

  await browser.close();
  console.log('\n=== All steps complete ===');
}

run().catch(err => {
  console.error('Fatal script error:', err);
  process.exit(1);
});
