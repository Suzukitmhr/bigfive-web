from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:3000")
    page.get_by_role("button", name="Decline").click()
    page.get_by_role("button", name="Login").click()
    page.screenshot(path="jules-scratch/verification/login.png")
    page.goto("http://localhost:3000/profile")
    page.screenshot(path="jules-scratch/verification/profile.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
