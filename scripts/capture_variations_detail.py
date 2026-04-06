from playwright.sync_api import sync_playwright
import time

def capture_variations_detail():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})

        print("Navigating to app...")
        page.goto("http://localhost:5174", wait_until='networkidle')
        time.sleep(3)

        # Click Library
        print("Clicking Library...")
        page.locator("text=Library").first.click()
        time.sleep(4)

        # Click first image
        print("Clicking first image...")
        page.locator("img[alt]").first.click()
        time.sleep(3)

        # Dump all buttons visible in the modal for debugging
        print("\n--- All buttons on page ---")
        buttons = page.locator("button").all()
        for i, btn in enumerate(buttons):
            try:
                title = btn.get_attribute("title") or ""
                text = btn.inner_text() or ""
                visible = btn.is_visible()
                print(f"  [{i}] visible={visible} title='{title}' text='{text[:60]}'")
            except:
                pass

        # Dump right panel content
        print("\n--- Right panel text content ---")
        try:
            right_panel = page.locator(".right-panel, aside, [class*='panel'], [class*='sidebar']").first
            print(right_panel.inner_text()[:2000])
        except Exception as e:
            print(f"Could not get right panel: {e}")

        # Click variations button
        print("\nClicking Variations button...")
        try:
            page.locator("button:has-text('Variations')").first.click()
            time.sleep(3)
        except Exception as e:
            print(f"Could not click Variations: {e}")

        # Now dump what the variations section looks like
        print("\n--- Page text after clicking Variations ---")
        try:
            full_text = page.locator("body").inner_text()
            # Find variations-related text
            lines = full_text.split('\n')
            for i, line in enumerate(lines):
                if any(kw in line.lower() for kw in ['variation', 'generate 4', 'shuffle', 'hint', 'level of change', 'engine']):
                    print(f"  Line {i}: {line}")
        except Exception as e:
            print(f"Error: {e}")

        # Take a full-page screenshot to see everything
        page.screenshot(path="C:/Users/User/Prompt-Generator/test-after-library.png", full_page=False)
        print("\nScreenshot saved.")

        # Also scroll the right panel and screenshot
        # Try to find and scroll to the variations section
        try:
            variations_section = page.locator("text=Generate 4 Variations").first
            if variations_section.count() > 0:
                variations_section.scroll_into_view_if_needed()
                time.sleep(1)
                page.screenshot(path="C:/Users/User/Prompt-Generator/test-after-library.png", full_page=False)
                print("Re-captured after scrolling to variations.")
        except Exception as e:
            print(f"Could not scroll to variations: {e}")

        browser.close()

if __name__ == "__main__":
    capture_variations_detail()
