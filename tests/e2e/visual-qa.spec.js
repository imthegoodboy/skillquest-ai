import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

async function captureFrame(page, filename, scrollY = 0) {
  const appFrame = page.frames().find((candidate) => candidate.url().includes("/anna-apps/"));
  expect(appFrame).toBeTruthy();
  await appFrame.evaluate((y) => {
    scrollTo(0, y);
    document.querySelectorAll(".toast").forEach((item) => item.remove());
  }, scrollY);
  if (scrollY) {
    await appFrame.locator(".reveal").evaluateAll((items) => items.forEach((item) => item.classList.add("is-visible")));
  }
  await page.evaluate(() => scrollTo(0, 0));
  const app = page.locator("iframe#app");
  const box = await app.boundingBox();
  expect(box).toBeTruthy();
  expect(box.width).toBeGreaterThanOrEqual(1190);
  await app.screenshot({ path: resolve("listing-assets", filename), animations: "disabled" });
}

test("capture exact Anna desktop views for listing QA", async ({ page }) => {
  await mkdir(resolve("listing-assets"), { recursive: true });
  await page.goto("/");
  const frame = page.frameLocator("iframe#app");
  await frame.getByRole("link", { name: /Create my first quest/ }).click();
  await frame.getByLabel("Skill to learn").fill("Documentary video editing");
  await frame.getByLabel("What result would count?").fill("Edit and explain a complete sixty-second documentary sequence.");
  await frame.getByRole("button", { name: "Continue" }).click();
  await frame.getByRole("button", { name: "Continue" }).click();
  await frame.getByLabel("Your reason").fill("I want to tell clearer stories for community projects.");
  await frame.getByRole("button", { name: /Generate my quest map/ }).click();
  await expect(frame.getByRole("heading", { name: "Cutcraft Citadel" })).toBeVisible({ timeout: 30_000 });
  await captureFrame(page, "quest-map-desktop.png", 520);
  await frame.locator('.island-nav .nav-item[href="#/home"]').evaluate((link) => link.click());
  await expect(frame.locator("h1", { hasText: "Cutcraft Citadel" })).toBeVisible();
  await captureFrame(page, "home-desktop.png");
});
