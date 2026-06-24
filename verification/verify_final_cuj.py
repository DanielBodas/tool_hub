from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Set viewport to mobile
    page.set_viewport_size({"width": 375, "height": 812})

    page.goto("http://localhost:3000/tools/baby-leave-planner")
    page.wait_for_timeout(1000)

    # Login
    page.get_by_role("button", name="Acceso por PIN").click()
    page.wait_for_timeout(500)
    page.get_by_placeholder("****").fill("1234")
    page.wait_for_timeout(500)
    page.get_by_role("button", name="Verificar PIN").click()
    page.wait_for_timeout(2000)

    # Show Config Tab (initial state)
    page.screenshot(path="/home/jules/verification/screenshots/config_tab.png")
    page.wait_for_timeout(1000)

    # Switch to Calendar tab
    page.get_by_role("button", name="Calendario y Planes").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/calendar_tab.png")

    # Scroll to calendar and select a day
    page.locator('button:has-text("20")').first.click()
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/day_selection.png")

    # Assign to Madre - Permiso Nacimiento (first button)
    page.get_by_role("button", name="Permiso Nacimiento").first.click()
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/day_assigned.png")

    page.wait_for_timeout(1000) # Hold final state

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
