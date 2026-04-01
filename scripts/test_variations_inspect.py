"""
Focused inspection script — load the page state from the last session,
zoom into the variations thumbnail strip, and inspect badges.
"""
import os
import sys
import time
from playwright.sync_api import sync_playwright

# Force UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SCREENSHOTS_DIR = "C:/Users/User/Prompt-Generator/screenshots"
BASE_URL = "https://prompt-generator-eight-umber.vercel.app"

def save(page, name):
    path = f"{SCREENSHOTS_DIR}/{name}.png"
    page.screenshot(path=path, full_page=False)
    print(f"[screenshot] {path}")
    return path

def save_crop(page, name, clip):
    """Save a cropped region of the page."""
    path = f"{SCREENSHOTS_DIR}/{name}.png"
    page.screenshot(path=path, clip=clip, full_page=False)
    print(f"[screenshot cropped] {path}")
    return path

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        page.set_default_timeout(15000)

        # Load homepage, navigate to Image Library, click first image
        print("[setup] Loading page and navigating to Image Library...")
        page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
        page.wait_for_selector("button", timeout=15000)
        time.sleep(2)

        # Click Image Library tab
        page.click("button:has-text('Image Library')")
        time.sleep(3)

        # Click first visible image
        imgs = page.query_selector_all("[class*='grid'] img")
        visible = [i for i in imgs if (b := i.bounding_box()) and b["width"] > 30]
        if not visible:
            print("No images found!")
            browser.close()
            return
        visible[0].scroll_into_view_if_needed()
        visible[0].click()
        time.sleep(2)

        # Click Variations
        page.click("button:has-text('Variations')")
        time.sleep(2)

        # Click Strong
        page.click("button:has-text('Strong')")
        time.sleep(1)

        # Scroll the right panel to see the Compare toggle (might be hidden/scrolled)
        print("\n[inspect] Looking for Compare: OpenAI vs Imagen toggle...")
        # Try to find it anywhere on page
        compare_els = page.query_selector_all("text=/compare/i, text=/imagen/i, text=/openai vs/i")
        for el in compare_els:
            try:
                txt = el.inner_text().strip()
                box = el.bounding_box()
                print(f"  Found: '{txt}' at box={box}")
            except:
                pass

        # Also check all text nodes containing "compare" or "imagen"
        result = page.evaluate("""() => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            const texts = [];
            let node;
            while (node = walker.nextNode()) {
                const txt = node.textContent.trim();
                if (txt.length > 2 && (txt.toLowerCase().includes('compare') || txt.toLowerCase().includes('imagen') || txt.toLowerCase().includes('oai') || txt.toLowerCase().includes('img badge'))) {
                    texts.push(txt);
                }
            }
            return texts;
        }""")
        print(f"\n  Text nodes with compare/imagen/oai: {result}")

        # Scroll the sidebar panel down in case Compare toggle is below fold
        sidebar = page.query_selector("[class*='panel'], [class*='sidebar'], [class*='right']")
        if sidebar:
            page.evaluate("(el) => el.scrollTop = 500", sidebar)
            time.sleep(1)
            save(page, "insp_01_scrolled_panel")

        # Check all input elements (checkboxes, toggles)
        print("\n[inspect] All interactive elements:")
        els = page.evaluate("""() => {
            const elements = document.querySelectorAll('input, [role="switch"], [role="checkbox"], [class*="toggle"], [class*="switch"]');
            return Array.from(elements).map(el => ({
                tag: el.tagName,
                type: el.type || '',
                id: el.id || '',
                class: el.className.substring(0, 80),
                text: el.textContent.trim().substring(0, 50),
                checked: el.checked,
                ariaLabel: el.getAttribute('aria-label') || '',
                visible: el.offsetWidth > 0 && el.offsetHeight > 0,
                rect: el.getBoundingClientRect().toJSON()
            }));
        }""")
        for el in els:
            print(f"  {el['tag']} type={el['type']} checked={el['checked']} text='{el['text']}' class='{el['class'][:50]}' rect={el['rect']}")

        save(page, "insp_02_before_generate")

        # Now click Generate 2 Variations
        print("\n[generate] Clicking Generate 2 Variations...")
        page.click("button:has-text('Generate 2 Variations')")
        save(page, "insp_03_gen_clicked")
        print("Waiting 90 seconds for results...")

        for i in range(18):
            time.sleep(5)
            elapsed = (i + 1) * 5

            # Check for variation result thumbnails
            variation_thumbs = page.query_selector_all(
                "[class*='variation'] img, [class*='result'] img, "
                "[class*='generated'] img, [class*='thumb'] img"
            )

            # Check for badges
            badge_texts = page.evaluate("""() => {
                const all = document.querySelectorAll('span, div, p, label');
                return Array.from(all)
                    .map(el => el.textContent.trim())
                    .filter(t => t.match(/^(OAI|IMG|OpenAI|Imagen)$/) || t.toLowerCase().includes('save') || t.toLowerCase().includes('variation'));
            }""")

            # Check for errors
            error_texts = page.evaluate("""() => {
                const all = document.querySelectorAll('[class*="error"], [class*="alert"], [role="alert"], [data-sonner-toast]');
                return Array.from(all).map(el => el.textContent.trim()).filter(t => t.length > 0);
            }""")

            print(f"\n  t={elapsed}s | variation_thumbs={len(variation_thumbs)} | badges={badge_texts[:10]} | errors={error_texts[:5]}")

            if error_texts:
                print(f"  ERROR DETECTED: {error_texts}")
                save(page, f"insp_error_{elapsed:03d}s")
                break

            if len(variation_thumbs) >= 2:
                print(f"  Results ready! {len(variation_thumbs)} variation images found.")
                break

        save(page, "insp_04_final")
        print("\n[final] Screenshot saved.")

        # Zoom into the variations strip (bottom-right panel area)
        # The panel is typically the right sidebar ~1550-1920 wide, bottom portion
        save_crop(page, "insp_05_panel_zoom", {
            "x": 1450, "y": 400, "width": 470, "height": 680
        })

        # Full DOM inspection for badges
        print("\n[dom] Searching for OAI/IMG badges in DOM...")
        badge_data = page.evaluate("""() => {
            const allEls = document.querySelectorAll('*');
            const matches = [];
            for (const el of allEls) {
                const txt = el.textContent.trim();
                const cls = el.className || '';
                if (typeof cls === 'string' && (cls.includes('badge') || cls.includes('oai') || cls.includes('img-') || cls.includes('label'))) {
                    if (txt.length < 20) {
                        matches.push({ tag: el.tagName, class: cls.substring(0, 60), text: txt });
                    }
                }
            }
            return matches.slice(0, 20);
        }""")
        print("  Badge DOM elements:")
        for b in badge_data:
            print(f"    {b['tag']} class='{b['class']}' text='{b['text']}'")

        # Check for any toast/notification
        toast_data = page.evaluate("""() => {
            const toasts = document.querySelectorAll('[data-sonner-toast], [class*="toast"], [class*="notification"]');
            return Array.from(toasts).map(el => el.textContent.trim()).filter(t => t.length > 0);
        }""")
        print(f"\n  Toast/notifications: {toast_data}")

        browser.close()
        print("\n[done] Inspection complete.")

if __name__ == "__main__":
    run()
