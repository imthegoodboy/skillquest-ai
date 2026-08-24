import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("real 390px Anna view stays usable without horizontal overflow", async ({ page }) => {
  await mkdir(resolve("listing-assets"), { recursive: true });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  const frame = page.frameLocator("iframe#app");
  await expect(frame.getByRole("heading", { name: /Turn one goal into a practice path that adapts/ })).toBeVisible();
  const appFrame = page.frames().find((candidate) => candidate.url().includes("/anna-apps/"));
  expect(await appFrame.evaluate(() => document.documentElement.clientWidth)).toBeLessThanOrEqual(390);
  await frame.getByRole("link", { name: /Build my practice path/ }).click();
  await frame.getByLabel("Your learning goal").fill("I want to learn documentary video editing and produce a clear sixty-second documentary sequence.");
  await frame.getByRole("button", { name: /Let Anna build my path/ }).click();
  await expect(frame.getByRole("heading", { name: "Cutcraft Citadel" })).toBeVisible({ timeout: 30_000 });
  const dimensions = await appFrame.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(dimensions.scroll).toBe(dimensions.client);
  await expect(frame.locator(".mobile-nav")).toBeVisible();
  await expect(frame.locator(".mobile-nav .nav-item")).toHaveCount(5);
  await frame.locator(".mobile-nav").getByRole("link", { name: "Coach" }).click();
  await expect(frame.getByLabel("Message the SkillQuest Mentor")).toBeVisible();
  await appFrame.evaluate(() => {
    scrollTo(0, 0);
    document.querySelectorAll(".toast").forEach((item) => item.remove());
  });
  await page.evaluate(() => scrollTo(0, 0));
  const box = await page.locator("iframe#app").boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(385);
  await page.locator("iframe#app").screenshot({ path: resolve("listing-assets", "mentor-mobile.png"), animations: "disabled" });
  expect(errors).toEqual([]);
});
