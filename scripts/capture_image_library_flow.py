"""
Capture three screenshots of the Image Library flow:
1. Main page (before clicking Image Library)
2. Immediately after clicking Image Library button
3. After waiting 3 seconds (to see if images load)
"""

from playwright.sync_api import sync_playwright
import time

SCREENSHOTS_DIR = "C:/Users/User/Prompt-Generator/screenshots"

def capture(page, path, label):
    page.screenshot(path=path, full_page=False)
    print(f"[SAVED] {label} -> {path}")
    print(f"  URL: {page.url}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})

    # --- Screenshot 1: Main page ---
    print("\n=== Step 1: Load main page ===")
    page.goto("http://localhost:3000", wait_until="networkidle")
    capture(page, f"{SCREENSHOTS_DIR}/lib_01_main_page.png", "Main page (before Image Library click)")

    # --- Screenshot 2: Immediately after clicking Image Library ---
    print("\n=== Step 2: Click Image Library button ===")

    # Look for the Image Library button/tab — try several selectors
    btn = None
    selectors = [
        "text=Image Library",
        "button:has-text('Image Library')",
        "a:has-text('Image Library')",
        "[data-tab='image-library']",
        "nav >> text=Image Library",
    ]
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if el.count() > 0:
                btn = el
                print(f"  Found button with selector: {sel}")
                break
        except Exception:
            continue

    if btn is None:
        print("  WARNING: Could not find Image Library button — dumping all buttons/links for inspection")
        buttons = page.locator("button, a, [role='tab'], [role='button']").all()
        for b in buttons:
            try:
                txt = b.inner_text().strip()
                if txt:
                    print(f"    - '{txt}'")
            except Exception:
                pass
        # Take screenshot of whatever state the page is in
        capture(page, f"{SCREENSHOTS_DIR}/lib_02_immediate.png", "Immediate (Image Library button NOT found)")
    else:
        btn.click()
        # Capture IMMEDIATELY — do NOT wait for network idle
        time.sleep(0.2)
        capture(page, f"{SCREENSHOTS_DIR}/lib_02_immediate.png", "Immediately after Image Library click")

    # --- Screenshot 3: After 3-second wait ---
    print("\n=== Step 3: Wait 3 seconds, then capture ===")
    time.sleep(3)
    capture(page, f"{SCREENSHOTS_DIR}/lib_03_after_3s.png", "After 3-second wait")

    browser.close()
    print("\nDone. All screenshots saved.")
