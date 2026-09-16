import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:4174", { waitUntil: "networkidle" });
await page.screenshot({ path: "output/components-visual-check.png", fullPage: true });
const cards = await page.locator("article").count();
const compact = await page.locator("article").nth(1).boundingBox();
if (cards !== 5 || !compact || Math.round(compact.width) !== 204 || Math.round(compact.height) !== 332) {
  throw new Error(`Unexpected component preview: ${cards} cards, compact=${JSON.stringify(compact)}`);
}
await browser.close();
