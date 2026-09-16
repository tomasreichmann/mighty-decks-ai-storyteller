import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:4174", { waitUntil: "networkidle" });
await page.screenshot({ path: "output/components-visual-check.png", fullPage: true });
await browser.close();
