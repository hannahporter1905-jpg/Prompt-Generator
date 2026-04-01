"""
Test Compare: OpenAI vs Imagen - final focused version.
Picks up from: modal is open, variations panel visible.
"""
from playwright.sync_api import sync_playwright
import time
import os

SCREENSHOTS_DIR = "C:/Users/User/Prompt-Generator/screenshots/compare_test"
BASE_URL = "https://prompt-generator-eight-umber.vercel.app"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def log(msg):
    safe = msg.encode('ascii', errors='replace').decode('ascii')
    print(safe, flush=True)

def save(page, name):
    path = f"{SCREENSHOTS_DIR}/{name}.png"
    page.screenshot(path=path, full_page=False)
    log(f"  [screenshot] {path}")
    return path


def open_modal_with_variations(page):
    """Steps 1-10: Get to modal with variations panel open. Returns True on success."""

    # 1. Load page
    log("[1] Loading homepage...")
    page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
    time.sleep(3)
    save(page, "F01_homepage")

    # 2. Select SpinJo brand
    log("[2] Selecting brand: SpinJo")
    selects = page.query_selector_all("select")
    if selects:
        selects[0].select_option(value="SpinJo")
        time.sleep(2)
    save(page, "F02_brand")

    # 3. Select reference
    log("[3] Selecting reference: Astronaut with Roulette")
    selects = page.query_selector_all("select")
    if len(selects) >= 2:
        opts = selects[1].evaluate("el => Array.from(el.options).map(o => o.value).filter(v => v)")
        if opts:
            selects[1].select_option(value=opts[0])
            time.sleep(2)
    save(page, "F03_reference")

    # 4. Generate prompt
    log("[4] Clicking Generate Prompt...")
    page.click("button:has-text('Generate Prompt')")
    time.sleep(2)
    save(page, "F04_generating_prompt")

    # 5. Wait for result (ChatGPT button = result ready)
    log("[5] Waiting for prompt result...")
    for _ in range(12):
        time.sleep(5)
        if page.query_selector("button:has-text('ChatGPT')"):
            log("    Result ready!")
            break
    save(page, "F05_result_ready")

    # 6. Generate ChatGPT image
    log("[6] Generating ChatGPT image...")
    page.click("button:has-text('ChatGPT')")
    time.sleep(3)
    save(page, "F06_generating_image")

    # 7. Wait for image
    log("[7] Waiting for image...")
    for i in range(15):
        time.sleep(5)
        spinner = page.query_selector("[class*='animate-spin']")
        imgs = page.evaluate("""() => document.querySelectorAll('img[src*="googleusercontent"], img[src*="lh3"], img[src*="drive"]').length""")
        log(f"    t={(i+1)*5}s: spinner={'yes' if spinner else 'no'}, google_imgs={imgs}")
        if imgs > 0 and not spinner:
            log("    Image ready!")
            break
    save(page, "F07_image_ready")

    # 8. Open modal by clicking the image container
    log("[8] Opening modal...")
    container = page.query_selector("[class*='cursor-pointer'][class*='aspect-square']") or \
                page.query_selector("[class*='cursor-pointer']:has(img)")
    if container:
        container.click()
        time.sleep(3)
    else:
        # Fallback: click any google image
        imgs = page.query_selector_all("img")
        for img in imgs:
            bbox = img.bounding_box()
            src = img.get_attribute('src') or ''
            if bbox and bbox['width'] > 80 and 'googleusercontent' in src:
                img.click()
                time.sleep(3)
                break
    save(page, "F08_modal_attempt")

    # Verify modal
    if not page.query_selector(".fixed.inset-0"):
        log("    Modal not found after image click!")
        return False

    log("    Modal open!")
    save(page, "F08b_modal_open")

    # 9. Click Variations button
    log("[9] Clicking Variations button...")
    page.click("button:has-text('Variations')")
    time.sleep(2)
    save(page, "F09_variations_panel")

    return True


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        success = open_modal_with_variations(page)
        if not success:
            log("FAILED: Could not open modal.")
            browser.close()
            return

        # ── Step 10: Find and click Compare toggle ─────────────────────────────
        log("\n[10] Finding Compare toggle...")

        # The toggle is a button whose text contains "Compare" and "Imagen"
        # It may contain the emoji ⚡ but we search by partial text
        compare_found = page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const found = btns.find(b => {
                const t = b.textContent || '';
                return t.includes('Compare') && t.includes('Imagen');
            });
            if (found) {
                const bbox = found.getBoundingClientRect();
                return {
                    cx: bbox.x + bbox.width/2,
                    cy: bbox.y + bbox.height/2,
                    text: found.textContent.replace(/[^\\x20-\\x7E]/g, '[?]').substring(0, 80),
                    class: (found.className || '').toString().substring(0, 80),
                };
            }
            return null;
        }""")

        if compare_found:
            log(f"    Compare toggle found: '{compare_found['text']}'")
            page.mouse.click(compare_found['cx'], compare_found['cy'])
            log("    Compare toggle clicked (should now be ON)")
            time.sleep(1)
        else:
            log("    Compare toggle not found - listing all buttons...")
            btns = page.evaluate("""() => {
                return Array.from(document.querySelectorAll('button')).map(b => ({
                    text: (b.textContent || '').replace(/[^\\x20-\\x7E]/g, '[?]').trim().substring(0, 60),
                    class: (b.className || '').toString().substring(0, 60),
                    visible: b.getBoundingClientRect().width > 0,
                })).filter(b => b.visible && b.text.length > 0);
            }""")
            for b in btns:
                log(f"    '{b['text']}' -- {b['class'][:50]}")
            save(page, "F10_no_compare_toggle")
            browser.close()
            return

        save(page, "F10_compare_toggle_on")

        # Verify it's ON
        toggle_state = page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const found = btns.find(b => {
                const t = b.textContent || '';
                return t.includes('Compare') && t.includes('Imagen');
            });
            if (found) {
                return {
                    text: (found.textContent || '').replace(/[^\\x20-\\x7E]/g, '[?]').trim().substring(0, 100),
                    class: (found.className || '').toString().substring(0, 120),
                    hasON: found.textContent.includes('ON'),
                };
            }
            return null;
        }""")
        log(f"    Toggle state: {toggle_state}")

        # ── Step 11: Select Strong ─────────────────────────────────────────────
        log("\n[11] Selecting Strong mode...")
        strong_btn = page.query_selector("button:has-text('Strong')")
        if strong_btn:
            # Check if already active, if not click it
            strong_class = strong_btn.get_attribute('class') or ''
            log(f"    Strong button class: {strong_class[:80]}")
            strong_btn.click()
            time.sleep(0.5)
            log("    Strong clicked")
        else:
            log("    Strong button not found")
        save(page, "F11_strong_mode")

        # ── Step 12: Type guidance text ────────────────────────────────────────
        log("\n[12] Typing 'sunny stadium' in guidance input...")
        guidance_filled = False

        # The input has placeholder "Optional guidance... e.g. 'Sunny stadium'"
        inputs = page.query_selector_all("input[type='text']")
        for inp in inputs:
            try:
                placeholder = inp.get_attribute('placeholder') or ''
                bbox = inp.bounding_box()
                if bbox and bbox['width'] > 100:
                    safe_ph = placeholder.encode('ascii', errors='replace').decode('ascii')
                    log(f"    Input: '{safe_ph[:60]}' size={int(bbox['width'])}x{int(bbox['height'])}")
                    if bbox['y'] > 300:  # Inside modal area
                        inp.fill("sunny stadium")
                        log("    Filled: 'sunny stadium'")
                        guidance_filled = True
                        break
            except Exception as e:
                log(f"    Input error: {e}")

        if not guidance_filled:
            log("    Trying all text inputs...")
            for inp in inputs:
                try:
                    bbox = inp.bounding_box()
                    if bbox and 0 < bbox['y'] < 900 and bbox['width'] > 80:
                        inp.fill("sunny stadium")
                        log(f"    Filled input at ({int(bbox['x'])},{int(bbox['y'])})")
                        guidance_filled = True
                        break
                except:
                    pass

        save(page, "F12_guidance_typed")

        # ── Step 13: Click Compare button ──────────────────────────────────────
        log("\n[13] Clicking Compare button...")

        # The button text will be "Compare" when compareEngines is ON
        compare_gen = page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const found = btns.find(b => {
                const t = (b.textContent || '').trim().replace(/[^\\x20-\\x7E]/g, '');
                return t === 'Compare' || t === 'Compare ' || t.endsWith('Compare');
            });
            if (found) {
                const bbox = found.getBoundingClientRect();
                return {
                    cx: bbox.x + bbox.width/2,
                    cy: bbox.y + bbox.height/2,
                    text: (found.textContent || '').replace(/[^\\x20-\\x7E]/g, '[?]').trim(),
                    disabled: found.disabled,
                };
            }
            return null;
        }""")

        if compare_gen:
            log(f"    Found Compare button: '{compare_gen['text']}' disabled={compare_gen['disabled']}")
            page.mouse.click(compare_gen['cx'], compare_gen['cy'])
            log("    Compare button clicked!")
        else:
            log("    Compare button not found, trying 'Generate' button...")
            gen_btn = page.evaluate("""() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const found = btns.find(b => {
                    const t = (b.textContent || '').replace(/[^\\x20-\\x7E]/g, '').trim();
                    return t.includes('Generate') || t.includes('Regenerate');
                });
                if (found) {
                    const bbox = found.getBoundingClientRect();
                    return { cx: bbox.x + bbox.width/2, cy: bbox.y + bbox.height/2, text: found.textContent.replace(/[^\\x20-\\x7E]/g, '[?]').trim() };
                }
                return null;
            }""")
            if gen_btn:
                log(f"    Clicking Generate: '{gen_btn['text']}'")
                page.mouse.click(gen_btn['cx'], gen_btn['cy'])
            else:
                log("    No compare/generate button found!")
                save(page, "F13_no_btn")
                browser.close()
                return

        time.sleep(3)
        save(page, "F13_compare_started")

        # ── Step 14: Wait up to 120 seconds ───────────────────────────────────
        log("\n[14] Waiting up to 120 seconds for comparison results...")
        start = time.time()
        found_results = False
        found_error = False
        error_msg = ""

        while time.time() - start < 120:
            elapsed = int(time.time() - start)
            time.sleep(5)

            if elapsed % 20 == 0:
                save(page, f"F14_poll_{elapsed:03d}s")

            spinner = page.query_selector("[class*='animate-spin']")

            # Check for error text in the variations panel
            errors = page.evaluate("""() => {
                const paras = Array.from(document.querySelectorAll('p'));
                return paras.filter(p => {
                    const t = p.textContent || '';
                    return (t.includes('fail') || t.includes('Error') || t.includes('error') || t.includes('Note:'))
                           && p.offsetWidth > 0 && t.length < 500;
                }).map(p => p.textContent.replace(/[^\\x20-\\x7E]/g, '?').substring(0, 200));
            }""")

            # Check for variation images appearing in the strip
            var_imgs = page.evaluate("""() => {
                // Look for images that were added as variations (have isVariation-like data)
                const imgs = Array.from(document.querySelectorAll('img'));
                return imgs.filter(img => {
                    const src = img.src || '';
                    return src.includes('googleusercontent') || src.includes('lh3') || src.includes('openai');
                }).length;
            }""")

            # Check for the gallery strip with multiple images (thumbnail strip at bottom)
            strip_imgs = page.evaluate("""() => {
                // The gallery strip shows thumbnails at the bottom
                return document.querySelectorAll('[class*="strip"] img, [class*="gallery"] img, [class*="thumb"] img').length;
            }""")

            log(f"    t={elapsed}s: spinner={'yes' if spinner else 'no'}, imgs={var_imgs}, strip={strip_imgs}, errors={errors}")

            if errors:
                error_msg = str(errors)
                found_error = True
                log(f"    ERROR: {error_msg}")
                save(page, f"F14_error_{elapsed}s")
                break

            # If spinner gone and we have more images than before
            if var_imgs > 1 and not spinner:
                log(f"    Results ready at t={elapsed}s!")
                found_results = True
                break

        # ── Final screenshots ─────────────────────────────────────────────────
        save(page, "F15_final")

        # Zoom into bottom of modal to see variations strip
        page.evaluate("""() => {
            const modal = document.querySelector('.fixed.inset-0');
            if (modal) {
                // Find the inner scrollable content and scroll to bottom
                const inner = modal.querySelector('[class*="overflow-y"]') || modal;
                inner.scrollTop = inner.scrollHeight;
            }
        }""")
        time.sleep(1)
        save(page, "F16_final_scrolled")

        # ── Detailed analysis ────────────────────────────────────────────────
        log("\n[ANALYSIS]")

        # Look for IMG/Imagen badges (orange badges added for imagen engine variations)
        badges = page.evaluate("""() => {
            const all = Array.from(document.querySelectorAll('*'));
            return all.filter(el => {
                if (!el.offsetWidth) return false;
                const t = (el.textContent || '').trim();
                const cls = (el.className || '').toString();
                // Match orange/amber badge elements that label the engine
                return (t === 'IMG' || t === 'Imagen' || t === 'OpenAI' || t === 'gpt-image-1') && el.children.length <= 1;
            }).map(el => ({
                text: el.textContent.trim(),
                class: (el.className || '').toString().substring(0, 100),
                bg: window.getComputedStyle(el).backgroundColor,
                color: window.getComputedStyle(el).color,
            }));
        }""")

        log(f"  Engine badges found: {len(badges)}")
        for badge in badges:
            log(f"    '{badge['text']}' bg={badge['bg']} color={badge['color']} class='{badge['class'][:60]}'")

        # Count all images in the modal
        modal_imgs = page.evaluate("""() => {
            const modal = document.querySelector('.fixed.inset-0');
            if (!modal) return 0;
            return modal.querySelectorAll('img').length;
        }""")
        log(f"  Images in modal: {modal_imgs}")

        # Check for variation panel text content
        var_panel_text = page.evaluate("""() => {
            const modal = document.querySelector('.fixed.inset-0');
            if (!modal) return '';
            return modal.innerText.replace(/[^\\x20-\\x7E\\n]/g, '?').substring(0, 1000);
        }""")
        log(f"  Modal text content:\n{var_panel_text[:500]}")

        log(f"\n[FINAL REPORT]")
        log(f"  Results appeared: {'YES' if found_results else 'NO (timeout or error)'}")
        log(f"  Error occurred:   {'YES - ' + error_msg[:200] if found_error else 'NO'}")
        log(f"  IMG badges found: {len(badges)}")
        log(f"  Screenshots at:   {SCREENSHOTS_DIR}")

        browser.close()


if __name__ == "__main__":
    run()
