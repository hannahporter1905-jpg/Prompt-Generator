from playwright.sync_api import sync_playwright
import time

def capture(page, path):
    page.screenshot(path=path, full_page=False)
    print(f"Screenshot saved: {path}")

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})

        # Step 1: Go to localhost:3000
        print("Navigating to http://localhost:3000 ...")
        page.goto("http://localhost:3000", wait_until="networkidle")
        capture(page, "C:/Users/User/Prompt-Generator/screenshots/01_initial_page.png")
        print("Step 1 done: initial page captured")

        # Step 2: Inject 12 test images into localStorage via JS
        inject_js = """
const images = Array.from({length:12}, (_, i) => ({
  id: `img-test-${i}`,
  created_at: new Date().toISOString(),
  filename: `test-image-${i}.png`,
  provider: i % 2 === 0 ? 'chatgpt' : 'gemini',
  aspect_ratio: '16:9',
  resolution: '1K',
  storage_path: '',
  public_url: `https://picsum.photos/seed/${i+1}/400/300`
}));
localStorage.setItem('pg_generated_images', JSON.stringify(images));
'Injected ' + images.length + ' images';
"""
        result = page.evaluate(inject_js)
        print(f"Step 2 done: {result}")

        # Step 3: Screenshot immediately after JS injection (before navigating anywhere)
        capture(page, "C:/Users/User/Prompt-Generator/screenshots/02_after_inject_before_nav.png")
        print("Step 3 done: screenshot after injection")

        # Step 4: Click the "Image Library" button
        print("Looking for Image Library button...")
        # Try various selectors
        selectors_to_try = [
            "text=Image Library",
            "button:has-text('Image Library')",
            "a:has-text('Image Library')",
            "[data-testid='image-library']",
            "text=Library",
        ]
        clicked = False
        for sel in selectors_to_try:
            try:
                el = page.locator(sel).first
                if el.count() > 0:
                    el.click()
                    clicked = True
                    print(f"Clicked using selector: {sel}")
                    break
            except Exception as e:
                print(f"Selector '{sel}' failed: {e}")

        if not clicked:
            print("Could not find Image Library button — capturing page HTML for debug")
            html = page.content()
            with open("C:/Users/User/Prompt-Generator/screenshots/debug_page.html", "w", encoding="utf-8") as f:
                f.write(html)
            print("HTML saved to screenshots/debug_page.html")

        # Step 5: Screenshot IMMEDIATELY after clicking (< 0.5s)
        capture(page, "C:/Users/User/Prompt-Generator/screenshots/03_immediately_after_click.png")
        print("Step 5 done: immediate screenshot after click")

        # Step 6: Wait 2 seconds, take another screenshot
        print("Waiting 2 seconds...")
        time.sleep(2)
        capture(page, "C:/Users/User/Prompt-Generator/screenshots/04_after_2s_wait.png")
        print("Step 6 done: screenshot after 2s")

        # Also wait a bit more for full load
        page.wait_for_load_state("networkidle")
        capture(page, "C:/Users/User/Prompt-Generator/screenshots/05_after_networkidle.png")
        print("Bonus: screenshot after networkidle")

        browser.close()
        print("All done.")

if __name__ == "__main__":
    run()
