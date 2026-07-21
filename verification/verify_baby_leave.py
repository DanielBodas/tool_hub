import os
from playwright.sync_api import sync_playwright

def run_cuj(page, context):
    # 1. Set the cookies to bypass PIN auth
    context.add_cookies([{
        'name': 'auth_tool_baby-leave-planner',
        'value': 'true',
        'domain': 'localhost',
        'path': '/'
    }])

    # 2. Go to page and set local storage
    page.goto("http://localhost:3000/tools/baby-leave-planner")
    page.wait_for_timeout(1000)
    page.evaluate("window.localStorage.setItem('unlocked_tools', '[\"baby-leave-planner\"]')")
    page.reload()
    page.wait_for_timeout(1000)

    # Verify we are inside the leave planner page
    assert "Leave Planner" in page.title() or page.locator("text=Leave Planner").is_visible()

    # 3. Choose a birth date in Settings
    # Open settings
    page.click("button[title='Configuración de Nacimiento']")
    page.wait_for_timeout(1000)

    # Fill birth date
    page.fill("input[type='date']", "2026-08-10")
    page.wait_for_timeout(1000)

    # Close settings to go back to calendar
    page.click("text=Volver al Calendario")
    page.wait_for_timeout(1000)

    # 4. Click on a calendar day button to open our redesigned Drawer/Sheet
    # Click on day 15
    day_15_button = page.get_by_role("button", name="15", exact=True).first
    day_15_button.click()
    page.wait_for_timeout(1000)

    # Take screenshot at the key moment (showing the beautiful newly redesigned day selection bottom drawer/sheet)
    screenshot_path = "verification/screenshots/verification.png"
    page.screenshot(path=screenshot_path)
    print(f"Screenshot taken at {screenshot_path}")

    # 5. Let's select "MAMÁ" and add/mark a leave block
    page.click("text=MAMÁ")
    page.wait_for_timeout(1000)

    # Take a final look
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="verification/videos",
            viewport={"width": 390, "height": 844} # Mobile viewport size (iPhone 12 Pro)
        )
        page = context.new_page()
        try:
            run_cuj(page, context)
        finally:
            context.close()
            browser.close()
