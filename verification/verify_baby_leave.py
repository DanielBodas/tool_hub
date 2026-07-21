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

    # 3. Open Gestón Madre Drawer
    page.click("button[title='Gestión Madre']")
    page.wait_for_timeout(1000)

    # Locate all buttons inside the Mother drawer
    # The first button in the drawer is the close button (ChevronLeft).
    # Then there is one for addAllowance (Plus).
    # Then there is the edit button for 'Permiso Nacimiento' (Edit2).
    # Let's find all buttons within the container and click the third one.
    drawer_buttons = page.locator("div.fixed.inset-y-0.left-0 button")
    edit_button = drawer_buttons.nth(2)
    edit_button.click()
    page.wait_for_timeout(1000)

    # Take screenshot showing weeks edit inputs
    screenshot_path = "verification/screenshots/verification_weeks.png"
    page.screenshot(path=screenshot_path)
    print(f"Screenshot taken at {screenshot_path}")

    # Close Mother Drawer
    close_button = drawer_buttons.first
    close_button.click()
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
