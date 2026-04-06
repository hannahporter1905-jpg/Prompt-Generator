from playwright.sync_api import sync_playwright
import time

def capture_variations():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})

        # Step 1: Go to the app
        print("Navigating to app...")
        page.goto("http://localhost:5174", wait_until='networkidle')
        time.sleep(3)

        # Step 2: Look for Library button/nav
        print("Looking for Library button...")
        library_selectors = [
            "text=Library",
            "[data-testid='library']",
            "button:has-text('Library')",
            "a:has-text('Library')",
            "nav a:has-text('Library')",
            ".library-btn",
            "[href*='library']",
        ]

        clicked_library = False
        for selector in library_selectors:
            try:
                el = page.locator(selector).first
                if el.count() > 0:
                    el.click()
                    print(f"Clicked library with: {selector}")
                    clicked_library = True
                    time.sleep(4)
                    break
            except Exception as e:
                print(f"  Failed {selector}: {e}")

        if not clicked_library:
            print("Could not find Library button, taking screenshot of current state")
            page.screenshot(path="C:/Users/User/Prompt-Generator/test-after-library.png", full_page=False)
            browser.close()
            return

        # Step 3: Click first image in the gallery
        print("Looking for images in the library...")
        image_selectors = [
            "img.cursor-pointer",
            ".image-card img",
            ".gallery img",
            ".library-grid img",
            "img[alt]",
            ".card img",
            "[role='img']",
            ".image-item",
        ]

        clicked_image = False
        for selector in image_selectors:
            try:
                el = page.locator(selector).first
                if el.count() > 0:
                    el.click()
                    print(f"Clicked image with: {selector}")
                    clicked_image = True
                    time.sleep(3)
                    break
            except Exception as e:
                print(f"  Failed image selector {selector}: {e}")

        if not clicked_image:
            # Try clicking the first clickable element that looks like a card
            try:
                page.locator(".group").first.click()
                print("Clicked .group element")
                clicked_image = True
                time.sleep(3)
            except Exception as e:
                print(f"  Failed .group: {e}")

        if not clicked_image:
            print("Could not find an image to click, taking screenshot")
            page.screenshot(path="C:/Users/User/Prompt-Generator/test-after-library.png", full_page=False)
            browser.close()
            return

        # Step 4: Look for the Variations / shuffle button
        print("Looking for Variations button...")
        variations_selectors = [
            "button:has-text('Variations')",
            "button[title*='Variations']",
            "button[title*='variation']",
            "[data-testid='variations-btn']",
            "button svg[class*='shuffle']",
            "button:has([data-icon='shuffle'])",
            ".variations-btn",
            "button:has-text('Generate')",
        ]

        clicked_variations = False
        for selector in variations_selectors:
            try:
                el = page.locator(selector).first
                if el.count() > 0:
                    el.click()
                    print(f"Clicked variations with: {selector}")
                    clicked_variations = True
                    time.sleep(3)
                    break
            except Exception as e:
                print(f"  Failed {selector}: {e}")

        if not clicked_variations:
            # Try title attribute search
            try:
                page.locator("button[title]").all()
                buttons = page.locator("button").all()
                for btn in buttons:
                    title = btn.get_attribute("title") or ""
                    text = btn.inner_text() or ""
                    if "variation" in title.lower() or "variation" in text.lower() or "shuffle" in title.lower():
                        btn.click()
                        print(f"Clicked button with title='{title}' text='{text}'")
                        clicked_variations = True
                        time.sleep(3)
                        break
            except Exception as e:
                print(f"  Button search failed: {e}")

        if not clicked_variations:
            print("WARNING: Could not find Variations button. Saving screenshot of modal state.")

        # Take final screenshot
        print("Saving final screenshot...")
        page.screenshot(path="C:/Users/User/Prompt-Generator/test-after-library.png", full_page=False)
        print("Screenshot saved to C:/Users/User/Prompt-Generator/test-after-library.png")

        # Print page content for debugging
        print("\n--- Page title:", page.title())
        print("--- Current URL:", page.url)

        browser.close()

if __name__ == "__main__":
    capture_variations()
