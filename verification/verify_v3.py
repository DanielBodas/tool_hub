from playwright.sync_api import sync_playwright
import os

def run_verification(page):
    # Set viewport to mobile
    page.set_viewport_size({"width": 375, "height": 812})

    page.goto("http://localhost:3000/tools/baby-leave-planner")
    page.wait_for_timeout(2000)

    # Login
    page.get_by_role("button", name="Acceso por PIN").click()
    page.get_by_placeholder("****").fill("1234")
    page.get_by_role("button", name="Verificar PIN").click()
    page.wait_for_timeout(5000)

    # 1. Verify Calendar is default
    page.screenshot(path="verification/v3_calendar_default.png")

    # 2. Verify Settings Gear
    page.get_by_title("Ajustes").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/v3_settings_open.png")
    page.get_by_title("Ajustes").click() # Close settings
    page.wait_for_timeout(500)

    # 3. Verify Side Drawer (Mother)
    page.get_by_title("Gestión Madre").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/v3_drawer_mother.png")

    # Refresh to clear drawers for next screenshot
    page.goto("http://localhost:3000/tools/baby-leave-planner")
    page.wait_for_timeout(3000)

    # 4. Verify Day Selection Highlight
    page.locator('button:has-text("12")').first.click()
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/v3_day_selected.png")

if __name__ == "__main__":
    if not os.path.exists("verification"):
        os.makedirs("verification")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            run_verification(page)
        finally:
            context.close()
            browser.close()
