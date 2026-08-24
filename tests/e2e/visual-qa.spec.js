import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

async function captureFrame(page, filename, scrollY = 0) {
  const appFrame = page.frames().find((candidate) => candidate.url().includes("/anna-apps/"));
  expect(appFrame).toBeTruthy();
  await appFrame.evaluate((y) => {
    document.documentElement.style.scrollBehavior = "auto";
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
  await expect(frame.getByRole("heading", { name: /Turn one goal into a practice path that adapts/ })).toBeVisible();
  await captureFrame(page, "home-desktop.png");
  await frame.getByRole("link", { name: /Build my practice path/ }).click();
  await expect(frame.getByRole("heading", { name: /What do you want to learn or become able to do/ })).toBeVisible();
  await captureFrame(page, "goal-desktop.png");
  await frame.getByLabel("Your learning goal").fill("I want to learn documentary video editing and produce a clear sixty-second documentary sequence for a community project.");
  await frame.getByLabel("Learning material or work sample").fill("My source contains an interview answer, two action details, a reaction, and a closing consequence.");
  await frame.getByRole("button", { name: /Let Anna build my path/ }).click();
  await expect(frame.getByRole("heading", { name: "Cutcraft Citadel" })).toBeVisible({ timeout: 30_000 });
  await captureFrame(page, "quest-map-desktop.png", 520);
  await frame.getByRole("link", { name: /Frame the Story/ }).click();
  await expect(frame.getByRole("button", { name: /Review my work/ })).toBeVisible();
  await captureFrame(page, "mission-work-desktop.png", 880);
});
