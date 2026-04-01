"""
Test Compare: OpenAI vs Imagen feature via the Result Display ImageModal.

Flow:
1. Load homepage
2. Select a brand
3. Select a reference prompt
4. Click Generate Prompt
5. Wait for result
6. Click ChatGPT (or Gemini) to generate an image
7. Wait for image
8. Click image thumbnail to open ImageModal
9. Click Variations button
10. Find and enable Compare toggle
11. Select Strong, type guidance, click Compare
12. Wait and report results
"""
from playwright.sync_api import sync_playwright
import time
import os
import sys

SCREENSHOTS_DIR = "C:/Users/User/Prompt-Generator/screenshots/compare_test"
BASE_URL = "https://prompt-generator-eight-umber.vercel.app"

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def log(msg):
    print(msg, flush=True)

def save(page, name):
    path = f"{SCREENSHOTS_DIR}/{name}.png"
    page.screenshot(path=path, full_page=False)
    log(f"  [screenshot] {path}")
    return path


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        # ── Step 1: Load homepage ──────────────────────────────────────────────
        log("\n[1] Loading homepage...")
        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        time.sleep(3)
        save(page, "T01_homepage")

        # ── Step 2: Select a brand ─────────────────────────────────────────────
        log("\n[2] Selecting a brand...")
        # Brand dropdown is a <select> element
        brand_select = page.query_selector("select")
        if brand_select:
            brand_select.select_option(value="SpinJo")
            log("    Selected: SpinJo")
            time.sleep(2)
        else:
            log("    No select found, looking for brand dropdown...")
            # Try clicking a combobox
            brand_combo = page.query_selector("[aria-label*='brand'], [placeholder*='brand'], [class*='brand']")
            if brand_combo:
                brand_combo.click()
                time.sleep(1)
                # Click SpinJo option
                spinjo = page.query_selector("text=SpinJo")
                if spinjo:
                    spinjo.click()
                    log("    Clicked SpinJo")
                    time.sleep(2)

        save(page, "T02_brand_selected")

        # ── Step 3: Select reference ────────────────────────────────────────────
        log("\n[3] Selecting reference prompt...")
        time.sleep(2)

        # Find all select elements
        selects = page.query_selector_all("select")
        log(f"    Found {len(selects)} select elements")
        for i, sel in enumerate(selects):
            options = sel.evaluate("el => Array.from(el.options).map(o => ({value: o.value, text: o.text})).slice(0, 5)")
            log(f"    Select {i}: {options}")

        # The reference dropdown is the second select (or first non-brand one)
        if len(selects) >= 2:
            ref_select = selects[1]
            options = ref_select.evaluate("el => Array.from(el.options).map(o => ({value: o.value, text: o.text}))")
            log(f"    Reference options: {len(options)}")
            # Select the second option (first is usually "Select...")
            non_empty = [o for o in options if o['value'] and o['value'] != '']
            if non_empty:
                first_ref = non_empty[0]
                ref_select.select_option(value=first_ref['value'])
                log(f"    Selected reference: {first_ref['text'][:60]}")
                time.sleep(3)  # Wait for reference data to load
        elif len(selects) == 1:
            log("    Only one select found, trying comboboxes for reference...")
            # Try to find reference dropdown
            ref_buttons = page.query_selector_all("[class*='reference'], [class*='Reference']")
            log(f"    Reference elements: {len(ref_buttons)}")

        save(page, "T03_reference_selected")

        # ── Step 4: Submit form ─────────────────────────────────────────────────
        log("\n[4] Clicking Generate Prompt...")
        gen_btn = page.query_selector("button:has-text('Generate Prompt')")
        if gen_btn:
            gen_btn.click()
            log("    Generate Prompt clicked")
            time.sleep(2)
        else:
            log("    ERROR: Generate Prompt button not found!")
            all_btns = page.query_selector_all("button")
            for btn in all_btns:
                txt = btn.inner_text().strip()
                if txt:
                    log(f"      Button: '{txt[:50]}'")
            save(page, "T04_ERROR_no_gen_btn")
            return

        save(page, "T04_generating")

        # ── Step 5: Wait for result ─────────────────────────────────────────────
        log("\n[5] Waiting up to 60s for prompt to generate...")
        for i in range(12):
            time.sleep(5)
            # Check if we're past the processing state
            chatgpt_btn = page.query_selector("button:has-text('ChatGPT')")
            gemini_btn = page.query_selector("button:has-text('Gemini')")
            if chatgpt_btn or gemini_btn:
                log(f"    Result appeared at {(i+1)*5}s!")
                break
            else:
                loading = page.query_selector("[class*='animate-spin']")
                log(f"    t={(i+1)*5}s: still loading... spinner={'yes' if loading else 'no'}")

        save(page, "T05_result_appeared")

        # ── Step 6: Generate an image with ChatGPT ─────────────────────────────
        log("\n[6] Generating image with ChatGPT...")
        chatgpt_btn = page.query_selector("button:has-text('ChatGPT')")
        if not chatgpt_btn:
            log("    ChatGPT button not found, checking all buttons...")
            all_btns = page.query_selector_all("button")
            for btn in all_btns:
                txt = btn.inner_text().strip()
                if txt:
                    log(f"      '{txt[:60]}'")
            save(page, "T06_ERROR_no_chatgpt_btn")
            return

        chatgpt_btn.click()
        log("    ChatGPT image generation clicked")
        time.sleep(3)
        save(page, "T06_generating_image")

        # ── Step 7: Wait for image to appear ───────────────────────────────────
        log("\n[7] Waiting up to 60s for image to generate...")
        image_found = False
        for i in range(12):
            time.sleep(5)
            # Look for generated image thumbnails
            imgs = page.evaluate("""() => {
                const allImgs = Array.from(document.querySelectorAll('img'));
                return allImgs.filter(img => {
                    const src = img.src || '';
                    const w = img.offsetWidth;
                    const h = img.offsetHeight;
                    return w > 80 && h > 60 && (
                        src.includes('drive.google') ||
                        src.includes('googleusercontent') ||
                        src.includes('openai') ||
                        src.includes('dall-e') ||
                        src.includes('supabase') ||
                        src.includes('blob:')
                    );
                }).length;
            }""")

            loading = page.query_selector("[class*='animate-spin']")
            error = page.query_selector("[class*='imageError'], [class*='image-error']")
            log(f"    t={(i+1)*5}s: generated_imgs={imgs}, loading={'yes' if loading else 'no'}, error={'yes' if error else 'no'}")

            if imgs > 0:
                log("    Image found!")
                image_found = True
                break

        save(page, "T07_after_image_gen")

        if not image_found:
            log("\n    WARNING: No image found. Checking for errors...")
            page_text = page.evaluate("() => document.body.innerText.substring(0, 2000).replace(/[^\\x20-\\x7E\\n]/g, '?')")
            log(f"    Page text snippet: {page_text[:500]}")

        # ── Step 8: Click image thumbnail to open modal ────────────────────────
        log("\n[8] Clicking image thumbnail to open modal...")
        time.sleep(2)

        # Get all images on page
        all_imgs = page.query_selector_all("img")
        log(f"    Total images on page: {len(all_imgs)}")

        modal_opened = False
        for img_el in all_imgs:
            try:
                bbox = img_el.bounding_box()
                src = img_el.get_attribute('src') or ''
                if bbox and bbox['width'] > 80 and bbox['height'] > 60:
                    # Skip SVGs, icons and very wide images (header/background)
                    if '.svg' in src or 'logo' in src.lower():
                        continue
                    log(f"    Trying image: {int(bbox['width'])}x{int(bbox['height'])} src={src[:70]}")
                    img_el.click()
                    time.sleep(2)

                    # Check for ImageModal (fixed inset-0 with pointer-events-auto)
                    modal = page.query_selector(".fixed.inset-0")
                    if modal:
                        log("    ImageModal opened!")
                        modal_opened = True
                        break
            except:
                pass

        save(page, "T08_after_thumbnail_click")

        if not modal_opened:
            log("\n    Modal not opened. The form may need different input or image gen failed.")
            log("    Checking for image containers with click handlers...")

            # Try clicking containers that might wrap thumbnails
            clickable = page.evaluate("""() => {
                const els = Array.from(document.querySelectorAll('*'));
                return els.filter(el => {
                    const style = window.getComputedStyle(el);
                    const bbox = el.getBoundingClientRect();
                    return style.cursor === 'pointer' && bbox.width > 60 && bbox.height > 60
                           && bbox.width < 600 && bbox.y > 0 && bbox.y < 1080;
                }).map(el => ({
                    tag: el.tagName,
                    class: (el.className || '').toString().substring(0, 80),
                    w: Math.round(el.getBoundingClientRect().width),
                    h: Math.round(el.getBoundingClientRect().height),
                    x: Math.round(el.getBoundingClientRect().x + el.getBoundingClientRect().width/2),
                    y: Math.round(el.getBoundingClientRect().y + el.getBoundingClientRect().height/2),
                    hasImg: !!el.querySelector('img'),
                }));
            }""")
            log(f"    Cursor-pointer elements with images:")
            for c in clickable:
                if c['hasImg']:
                    log(f"      <{c['tag']}> {c['w']}x{c['h']} at ({c['x']},{c['y']}) class='{c['class'][:60]}'")
                    page.mouse.click(c['x'], c['y'])
                    time.sleep(2)
                    modal = page.query_selector(".fixed.inset-0")
                    if modal:
                        log("    MODAL OPENED via container click!")
                        modal_opened = True
                        save(page, "T08b_modal_via_container")
                        break

        # ── Step 9: Interact with the ImageModal ───────────────────────────────
        if modal_opened:
            log("\n[9] Modal is open, taking screenshot...")
            save(page, "T09_modal_open")

            # Find and click Variations button (bottom-left of modal)
            log("\n[10] Clicking Variations button...")
            var_btn = page.query_selector("button:has-text('Variations')")
            if var_btn:
                var_btn.click()
                time.sleep(2)
                save(page, "T10_variations_open")
                log("    Variations panel opened")
            else:
                log("    Variations button not found")
                # Log all buttons in modal
                btns = page.query_selector_all("button")
                for b in btns:
                    txt = b.inner_text().strip()
                    if txt:
                        log(f"      btn: '{txt[:50]}'")
                save(page, "T10_no_variations_btn")
                return

            # Find the Compare toggle
            log("\n[11] Looking for Compare toggle...")
            compare_toggle = None
            all_btns = page.query_selector_all("button")
            for btn in all_btns:
                txt = btn.inner_text()
                if 'compare' in txt.lower() and ('imagen' in txt.lower() or 'openai' in txt.lower()):
                    log(f"    Found: '{txt.strip()[:80]}'")
                    compare_toggle = btn
                    break

            if not compare_toggle:
                # Look for any element with compare/imagen text
                log("    Button not found, searching all elements...")
                compare_el = page.evaluate("""() => {
                    const all = Array.from(document.querySelectorAll('*'));
                    const found = all.find(el => {
                        const txt = (el.textContent || '').toLowerCase();
                        return txt.includes('compare') && (txt.includes('imagen') || txt.includes('openai vs'));
                    });
                    if (found) {
                        const bbox = found.getBoundingClientRect();
                        return { tag: found.tagName, text: found.textContent.substring(0, 100), x: bbox.x, y: bbox.y, cx: bbox.x + bbox.width/2, cy: bbox.y + bbox.height/2 };
                    }
                    return null;
                }""")
                if compare_el:
                    log(f"    Found element: {compare_el}")
                    page.mouse.click(compare_el['cx'], compare_el['cy'])
                    compare_toggle = True
                    time.sleep(1)

            if compare_toggle and compare_toggle is not True:
                compare_toggle.click()
                log("    Compare toggle clicked (ON)")
                time.sleep(1)

            save(page, "T11_compare_toggle")

            # Select Strong
            log("\n[12] Selecting Strong mode...")
            strong_btn = page.query_selector("button:has-text('Strong')")
            if strong_btn:
                strong_btn.click()
                log("    Strong selected")
                time.sleep(0.5)
            else:
                log("    Strong button not found")
            save(page, "T12_strong_selected")

            # Type guidance
            log("\n[13] Typing guidance text...")
            # The guidance input has placeholder "Optional guidance... e.g. 'Sunny stadium'"
            guidance_inputs = page.query_selector_all("input[type='text']")
            guidance_filled = False
            for inp in guidance_inputs:
                try:
                    placeholder = inp.get_attribute('placeholder') or ''
                    bbox = inp.bounding_box()
                    if bbox and bbox['width'] > 100:
                        log(f"    Input: placeholder='{placeholder}' size={int(bbox['width'])}x{int(bbox['height'])}")
                        if 'guidance' in placeholder.lower() or 'sunny' in placeholder.lower() or 'optional' in placeholder.lower():
                            inp.fill("sunny stadium")
                            log("    Typed 'sunny stadium'")
                            guidance_filled = True
                            break
                except:
                    pass

            if not guidance_filled:
                log("    Trying any visible text input...")
                for inp in guidance_inputs:
                    try:
                        bbox = inp.bounding_box()
                        if bbox and bbox['width'] > 100 and 0 <= bbox['y'] <= 1080:
                            inp.fill("sunny stadium")
                            log(f"    Typed in input at ({int(bbox['x'])},{int(bbox['y'])})")
                            guidance_filled = True
                            break
                    except:
                        pass

            save(page, "T13_guidance_typed")

            # Find and click the Compare/Generate button
            log("\n[14] Clicking Compare button...")
            compare_btn = None
            all_btns_final = page.query_selector_all("button")
            for btn in all_btns_final:
                txt = btn.inner_text().strip()
                if txt.lower() in ['compare', 'generate', 'regenerate']:
                    compare_btn = btn
                    log(f"    Found button: '{txt}'")
                    break

            if not compare_btn:
                log("    Exact match not found, trying partial match...")
                for btn in all_btns_final:
                    txt = btn.inner_text().strip()
                    if 'compare' in txt.lower() or ('generate' in txt.lower() and '2' in txt):
                        compare_btn = btn
                        log(f"    Found: '{txt}'")
                        break

            if compare_btn:
                compare_btn.click()
                log("    Compare/Generate button clicked!")
                time.sleep(3)
                save(page, "T14_compare_clicked")

                # ── Step 15: Wait up to 120 seconds ───────────────────────────
                log("\n[15] Waiting up to 120 seconds for results...")
                found_results = False
                found_error = False
                start_time = time.time()

                while time.time() - start_time < 120:
                    elapsed = int(time.time() - start_time)
                    time.sleep(5)

                    # Take screenshot every 15 seconds
                    if elapsed % 15 == 0:
                        save(page, f"T15_poll_{elapsed:03d}s")

                    # Check for loading spinner
                    spinner = page.query_selector("[class*='animate-spin']")

                    # Check for new images (variation results)
                    new_imgs = page.evaluate("""() => {
                        const imgs = Array.from(document.querySelectorAll('img'));
                        return imgs.filter(img => {
                            const src = img.src || '';
                            const isVar = img.closest('[class*="variation"]') !== null ||
                                          img.closest('[class*="strip"]') !== null;
                            return src.length > 10 && img.offsetWidth > 50 && (isVar || src.includes('blob'));
                        }).length;
                    }""")

                    # Check for error messages in the modal
                    error_els = page.evaluate("""() => {
                        const errs = Array.from(document.querySelectorAll('p, span, div'));
                        return errs.filter(el => {
                            const txt = el.textContent || '';
                            return (txt.includes('failed') || txt.includes('error') || txt.includes('Error'))
                                   && el.offsetWidth > 0 && el.children.length <= 1 && txt.length < 500;
                        }).map(el => el.textContent.substring(0, 200).replace(/[^\\x20-\\x7E]/g, '?')).slice(0, 3);
                    }""")

                    log(f"  t={elapsed}s: spinner={'yes' if spinner else 'no'}, variation_imgs={new_imgs}, errors={error_els}")

                    if error_els:
                        log(f"    ERRORS FOUND: {error_els}")
                        found_error = True
                        save(page, f"T15_error_at_{elapsed}s")
                        break

                    if new_imgs > 0 and not spinner:
                        log(f"    Results appeared at {elapsed}s!")
                        found_results = True
                        break

                # Final screenshots
                save(page, "T16_final_result")

                # Zoom in on the bottom of the modal where variations appear
                page.evaluate("""() => {
                    const fixed = document.querySelector('.fixed.inset-0');
                    if (fixed) fixed.scrollTop = fixed.scrollHeight;
                }""")
                time.sleep(1)
                save(page, "T17_final_scrolled")

                # ── Analyze results ────────────────────────────────────────────
                log("\n[RESULTS ANALYSIS]")

                # Check for IMG badges (orange badges from the variationEngine='imagen' code)
                img_badges = page.evaluate("""() => {
                    // The code adds an "IMG" or "Imagen" label for imagen engine variations
                    const all = Array.from(document.querySelectorAll('*'));
                    const badges = all.filter(el => {
                        const txt = (el.textContent || el.innerText || '').trim();
                        const isSmall = el.children.length === 0 || el.children.length <= 2;
                        return isSmall && (txt === 'IMG' || txt === 'Imagen' || txt === 'OpenAI' || txt.includes('Imagen'));
                    }).map(el => ({
                        text: el.textContent.trim().substring(0, 50).replace(/[^\\x20-\\x7E]/g, '?'),
                        class: (el.className || '').toString().substring(0, 80),
                        visible: el.offsetWidth > 0,
                    })).filter(el => el.visible);
                    return badges.slice(0, 10);
                }""")
                log(f"  IMG/Imagen/OpenAI badges found: {len(img_badges)}")
                for b in img_badges:
                    log(f"    Badge: '{b['text']}' class='{b['class']}'")

                # Get error messages
                final_errors = page.evaluate("""() => {
                    const pEls = Array.from(document.querySelectorAll('p, [class*="error"]'));
                    return pEls.filter(el => {
                        const txt = el.textContent || '';
                        return txt.length > 10 && txt.length < 500 && el.offsetWidth > 0;
                    }).map(el => el.textContent.trim().substring(0, 200).replace(/[^\\x20-\\x7E]/g, '?')).slice(0, 5);
                }""")
                if final_errors:
                    log(f"  Error messages: {final_errors}")
                else:
                    log("  No error messages found")

                log(f"\n  SUMMARY:")
                log(f"  - Results appeared: {'YES' if found_results else 'NO'}")
                log(f"  - Error occurred: {'YES' if found_error else 'NO'}")
                log(f"  - IMG badges: {len(img_badges)}")

            else:
                log("    No Compare/Generate button found")
                all_btn_texts = [b.inner_text().strip() for b in all_btns_final if b.inner_text().strip()]
                log(f"    All buttons: {all_btn_texts[:20]}")
                save(page, "T14_no_compare_btn")
        else:
            log("\n    Modal did not open. Check screenshots for current state.")
            save(page, "T09_ERROR_no_modal")

        log(f"\n[DONE] Screenshots saved to: {SCREENSHOTS_DIR}")
        browser.close()


if __name__ == "__main__":
    run()
