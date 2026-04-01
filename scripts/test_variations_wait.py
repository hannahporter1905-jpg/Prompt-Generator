"""
Wait properly for variation generation to finish, then capture zoomed results.
We know generation is done when "Generating..." text disappears OR
"Save" buttons appear under thumbnails.
"""
import sys
import time
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SCREENSHOTS_DIR = "C:/Users/User/Prompt-Generator/screenshots"
BASE_URL = "https://prompt-generator-eight-umber.vercel.app"

def save(page, name):
    path = f"{SCREENSHOTS_DIR}/{name}.png"
    page.screenshot(path=path, full_page=False)
    print(f"[screenshot] {path}")

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

        # Check for Compare toggle one more time with exhaustive search
        compare_found = page.evaluate("""() => {
            // Traverse entire DOM looking for text that includes "compare" or "imagen"
            function walk(node, found) {
                if (node.nodeType === 3) {
                    const txt = node.textContent.trim().toLowerCase();
                    if (txt.includes('compare') || txt.includes('imagen') || txt.includes('vs openai')) {
                        found.push({
                            text: node.textContent.trim(),
                            parentTag: node.parentElement ? node.parentElement.tagName : '',
                            parentClass: node.parentElement ? (node.parentElement.className || '').substring(0, 60) : ''
                        });
                    }
                }
                for (const child of node.childNodes) {
                    walk(child, found);
                }
            }
            const found = [];
            walk(document.body, found);
            return found;
        }""")
        if compare_found:
            print(f"[compare] Found {len(compare_found)} elements:")
            for c in compare_found:
                print(f"  {c}")
        else:
            print("[compare] 'Compare: OpenAI vs Imagen' toggle NOT found in DOM.")
            print("  This feature may not be implemented in the current build.")

        # Click Generate
        page.click("button:has-text('Generate 2 Variations')")
        print("\n[generate] Clicked Generate 2 Variations. Waiting for completion...")
        save(page, "wait_01_gen_start")

        # Poll — done when "Generating..." text is gone and we have "Save" buttons
        done = False
        for i in range(24):  # up to 120 seconds
            time.sleep(5)
            elapsed = (i + 1) * 5

            # Check generating status
            is_generating = page.evaluate("""() => {
                const all = document.querySelectorAll('*');
                for (const el of all) {
                    if (el.children.length === 0 && el.textContent.trim().toLowerCase().includes('generating')) {
                        return true;
                    }
                }
                return false;
            }""")

            # Check for Save buttons (appear under each generated variation)
            save_btns = page.evaluate("""() => {
                const btns = document.querySelectorAll('button, a');
                return Array.from(btns)
                    .filter(b => {
                        const txt = b.textContent.trim().toLowerCase();
                        const rect = b.getBoundingClientRect();
                        return (txt === 'save' || txt.includes('save variation') || txt.includes('save #')) && rect.left > 1400;
                    })
                    .map(b => ({ text: b.textContent.trim(), class: (b.className || '').substring(0, 50) }));
            }""")

            # Check errors
            errors = page.evaluate("""() => {
                const toasts = document.querySelectorAll('[data-sonner-toast], [class*="toast"]');
                const alerts = document.querySelectorAll('[role="alert"], [class*="error"]');
                const all = [...toasts, ...alerts];
                return all.map(e => e.textContent.trim()).filter(t => t.length > 0 && t.length < 200);
            }""")

            print(f"  t={elapsed}s | generating={is_generating} | save_btns={len(save_btns)} | errors={errors[:3]}")

            if errors:
                print(f"  ERROR DETECTED at {elapsed}s: {errors}")
                save(page, f"wait_error_{elapsed:03d}s")

            if save_btns:
                print(f"  Save buttons found — generation complete! {save_btns}")
                done = True
                break

            if not is_generating and elapsed > 10:
                print(f"  'Generating...' text gone at {elapsed}s — checking results")
                done = True
                break

        save(page, "wait_02_final")

        # Full sidebar screenshot
        save_crop(page, "wait_03_sidebar", {"x": 1550, "y": 0, "width": 370, "height": 1080})

        # Get all text in sidebar sorted by y
        sidebar_text = page.evaluate("""() => {
            const items = [];
            const all = document.querySelectorAll('*');
            for (const el of all) {
                const rect = el.getBoundingClientRect();
                const txt = el.textContent.trim();
                if (rect.left > 1500 && rect.width > 0 && rect.height > 0 && el.children.length === 0 && txt && txt.length < 100) {
                    items.push({ text: txt, y: Math.round(rect.y), tag: el.tagName, class: (el.className||'').substring(0,40) });
                }
            }
            items.sort((a, b) => a.y - b.y);
            // Remove duplicates
            const seen = new Set();
            return items.filter(i => {
                const key = i.y + i.text;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }""")

        print("\n[sidebar text after generation]:")
        for item in sidebar_text:
            print(f"  y={item['y']:4d} {item['tag']:6s} '{item['text']}'")

        # Check for OAI/IMG/Save badges specifically
        badges = page.evaluate("""() => {
            const all = document.querySelectorAll('*');
            const found = [];
            for (const el of all) {
                if (el.children.length > 0) continue;
                const txt = el.textContent.trim();
                const rect = el.getBoundingClientRect();
                if (rect.left > 1400 && rect.width > 0 && rect.height > 0) {
                    if (txt.match(/^(OAI|IMG|Save|Save #1|Save #2|Save V1|Save V2)$/i) ||
                        txt.toLowerCase().includes('oai') ||
                        txt.toLowerCase().includes('imagen')) {
                        found.push({ text: txt, tag: el.tagName, class: (el.className||'').substring(0,50), y: Math.round(rect.y) });
                    }
                }
            }
            return found;
        }""")
        print(f"\n[OAI/IMG/Save badge elements]: {badges}")

        # Also count images now visible in the panel that are new (not gallery)
        new_imgs = page.evaluate("""() => {
            const imgs = document.querySelectorAll('img');
            const found = [];
            for (const img of imgs) {
                const rect = img.getBoundingClientRect();
                if (rect.left > 1450 && rect.y > 450 && rect.width > 30 && rect.height > 30) {
                    const src = img.src || '';
                    // OpenAI images come from oaidalleapiprodscus or similar domains
                    // Our own Google Drive images come from lh3.googleusercontent.com
                    found.push({
                        src: src.substring(0, 100),
                        domain: src.includes('oai') || src.includes('openai') ? 'OPENAI' :
                                src.includes('vertexai') || src.includes('googleapis') ? 'VERTEX/GOOGLE' :
                                src.includes('lh3.googleusercontent') ? 'GOOGLE_DRIVE' :
                                src.includes('blob:') ? 'BLOB' : 'OTHER',
                        x: Math.round(rect.x), y: Math.round(rect.y),
                        w: Math.round(rect.width), h: Math.round(rect.height),
                        alt: img.alt
                    });
                }
            }
            return found;
        }""")
        print(f"\n[Images in panel area (y>450)]:")
        for img in new_imgs:
            print(f"  {img['domain']:15s} y={img['y']:4d} w={img['w']} h={img['h']} alt='{img['alt']}' src='{img['src'][:60]}'")

        browser.close()
        print("\n[done]")

if __name__ == "__main__":
    run()
