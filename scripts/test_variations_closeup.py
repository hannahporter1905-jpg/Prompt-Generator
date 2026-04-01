"""
Get a tight crop of just the V1/V2 variation thumbnails and their badges.
"""
import sys
import time
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SCREENSHOTS_DIR = "C:/Users/User/Prompt-Generator/screenshots"
BASE_URL = "https://prompt-generator-eight-umber.vercel.app"

def save_crop(page, name, clip):
    path = f"{SCREENSHOTS_DIR}/{name}.png"
    page.screenshot(path=path, clip=clip, full_page=False)
    print(f"[cropped] {path}")

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        page.set_default_timeout(15000)

        print("[setup] Loading page...")
        page.goto(BASE_URL, wait_until="networkidle", timeout=60000)
        page.wait_for_selector("button", timeout=15000)
        time.sleep(2)

        page.click("button:has-text('Image Library')")
        time.sleep(3)

        imgs = page.query_selector_all("[class*='grid'] img")
        visible = [i for i in imgs if (b := i.bounding_box()) and b["width"] > 30]
        visible[0].scroll_into_view_if_needed()
        visible[0].click()
        time.sleep(2)

        page.click("button:has-text('Variations')")
        time.sleep(1)
        page.click("button:has-text('Strong')")
        time.sleep(1)
        page.click("button:has-text('Generate 2 Variations')")

        print("Waiting for generation to complete...")
        # Wait for "Generating..." to disappear
        for i in range(24):
            time.sleep(5)
            elapsed = (i + 1) * 5
            is_gen = page.evaluate("""() => {
                const all = document.querySelectorAll('*');
                for (const el of all) {
                    if (el.children.length === 0 && el.textContent.trim().toLowerCase().includes('generating')) return true;
                }
                return false;
            }""")
            print(f"  t={elapsed}s generating={is_gen}")
            if not is_gen and elapsed > 10:
                print("  Done!")
                break

        time.sleep(2)  # extra buffer for render

        # Get the exact positions of V1 and V2 images
        v_positions = page.evaluate("""() => {
            const imgs = document.querySelectorAll('img');
            const found = [];
            for (const img of imgs) {
                const rect = img.getBoundingClientRect();
                const alt = img.alt || '';
                const src = img.src || '';
                if ((alt.includes('Variation') || alt.includes('variation')) && rect.width > 30) {
                    found.push({
                        alt, src: src.substring(0, 60),
                        x: Math.round(rect.x), y: Math.round(rect.y),
                        w: Math.round(rect.width), h: Math.round(rect.height)
                    });
                }
            }
            return found;
        }""")
        print(f"\n[Variation images]: {v_positions}")

        # Get all text/badges near those images
        if v_positions:
            min_y = min(v["y"] for v in v_positions)
            max_y = max(v["y"] + v["h"] for v in v_positions)
            min_x = min(v["x"] for v in v_positions)
            max_x = max(v["x"] + v["w"] for v in v_positions)
            print(f"  Bounding box of all variation images: x={min_x} y={min_y} -> x={max_x} y={max_y}")

            # Get all text in that bounding area + some padding
            nearby_text = page.evaluate(f"""() => {{
                const all = document.querySelectorAll('*');
                const found = [];
                for (const el of all) {{
                    if (el.children.length > 0) continue;
                    const rect = el.getBoundingClientRect();
                    const txt = el.textContent.trim();
                    if (!txt) continue;
                    // Check proximity to variation images
                    if (rect.x > {min_x - 50} && rect.y > {min_y - 80} &&
                        rect.x < {max_x + 50} && rect.y < {max_y + 100}) {{
                        found.push({{ text: txt, tag: el.tagName, y: Math.round(rect.y), x: Math.round(rect.x), class: (el.className||'').substring(0,50) }});
                    }}
                }}
                found.sort((a, b) => a.y - b.y);
                return found;
            }}""")
            print(f"\n[Text near variation images]:")
            for t in nearby_text:
                print(f"  x={t['x']:4d} y={t['y']:4d} {t['tag']:6s} '{t['text']}' class='{t['class']}'")

            # Save a tight crop around the variation thumbnails + badges (with padding)
            clip = {
                "x": max(0, min_x - 20),
                "y": max(0, min_y - 60),
                "width": min(1920, max_x - min_x + 60),
                "height": min(1080, max_y - min_y + 120)
            }
            save_crop(page, "closeup_01_variation_thumbs", clip)
            print(f"\n[clip] {clip}")

        # Also full width of sidebar at variation height
        save_crop(page, "closeup_02_full_row", {
            "x": 1450,
            "y": max(0, (v_positions[0]["y"] if v_positions else 600) - 80),
            "width": 470,
            "height": 350
        })

        # Full page crop of the variations section
        # Based on our earlier data: thumbnails at y~670, STR badge at y~674, V1/V2 at y~786
        save_crop(page, "closeup_03_var_section", {
            "x": 1450, "y": 560, "width": 470, "height": 350
        })

        print("\n[done]")

if __name__ == "__main__":
    run()
