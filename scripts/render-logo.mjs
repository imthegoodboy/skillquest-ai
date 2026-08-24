import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const svg = await readFile("src/logo.svg", "utf8");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });

await page.setContent(`<style>html,body{margin:0;width:512px;height:512px;overflow:hidden}svg{display:block;width:512px;height:512px}</style>${svg}`);
await page.screenshot({ path: "listing-assets/skillquest-logo.png", animations: "disabled" });
await browser.close();

console.log("Rendered listing-assets/skillquest-logo.png (512x512).");
