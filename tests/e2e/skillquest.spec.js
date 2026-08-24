import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

async function openApp(page) {
  await page.goto("/");
  const frame = page.frameLocator("iframe#app");
  await expect(frame.getByRole("heading", { name: /Turn one goal into a practice path that adapts/ })).toBeVisible();
  return frame;
}

async function createMockAdventure(frame) {
  await frame.getByRole("link", { name: /Build my practice path/ }).click();
  await expect(frame.getByRole("heading", { name: /What do you want to learn or become able to do/ })).toBeVisible();
  await frame.getByLabel("Your learning goal").fill("I want to learn documentary video editing and produce a clear sixty-second documentary sequence for a community project.");
  await frame.getByLabel("Learning material or work sample").fill("My source contains an opening location shot, one interview answer, two action details, a reaction, and a closing consequence.");
  await frame.getByRole("button", { name: /Let Anna build my path/ }).click();
  await expect(frame.getByRole("heading", { name: "Cutcraft Citadel" })).toBeVisible({ timeout: 30_000 });
}

test("complete goal-to-mission-to-Mentor workflow works inside Anna", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  const frame = await openApp(page);
  await createMockAdventure(frame);
  await expect(frame.getByText("Designed by Anna")).toBeVisible();
  await expect(frame.locator(".quest-node")).toHaveCount(12);
  await frame.getByRole("link", { name: /Frame the Story/ }).click();
  await expect(frame.getByRole("heading", { name: "Story intention comes before polish" })).toBeVisible();
  await frame.getByText("Why this task matters").click();
  await expect(frame.getByText("A cut is useful when it changes information")).toBeVisible();
  await frame.getByText("Review the 3 success checks").click();
  const checks = frame.locator(".criteria-checks input");
  await checks.nth(0).check();
  await checks.nth(1).check();
  await checks.nth(2).check();
  await frame.getByLabel(/Your work or learning material/).fill("SHOT 1 location; SHOT 2 interview claim; SHOT 3 hands working; SHOT 4 reaction; SHOT 5 consequence; SHOT 6 closing detail.");
  await frame.getByLabel("What did you do or change?").fill("I created a six-shot paper edit, wrote the story purpose beside every shot, and removed an establishing shot that repeated information.");
  await frame.getByLabel(/What felt difficult or surprising/).fill("The cut into the reaction changed the meaning most because it showed the consequence before the explanation.");
  await frame.getByRole("button", { name: "Review my work" }).click();
  const completion = frame.getByRole("dialog");
  await expect(completion.getByRole("heading", { name: "Frame the Story" })).toBeVisible({ timeout: 30_000 });
  await expect(completion.getByText("+110")).toBeVisible();
  await completion.getByRole("button", { name: "Review feedback" }).evaluate((button) => button.click());
  await expect(frame.getByText(/Work review · Local fallback/)).toBeVisible();
  await expect(frame.getByText(/Your submission records 3 of 3 success criteria/)).toBeVisible();

  await frame.getByRole("link", { name: "Practice path" }).first().evaluate((link) => link.click());
  await expect(frame.getByRole("link", { name: /Cut on Meaning/ })).toBeVisible();
  await frame.locator('.island-nav .nav-item[href="#/home"]').evaluate((link) => link.click());
  await expect(frame.getByText("1 of 12 quests")).toBeVisible();
  await frame.getByRole("link", { name: /View full path/ }).click();
  await expect(frame.getByRole("link", { name: /Cut on Meaning/ })).toBeVisible();

  await frame.getByRole("link", { name: "Coach" }).first().evaluate((link) => link.click());
  await frame.getByRole("button", { name: /Help me start Cut on Meaning/ }).click();
  await frame.getByRole("button", { name: "Send" }).click();
  const reply = frame.locator(".mentor-message--assistant").last();
  await expect(reply).toContainText("Local fallback");
  await expect(reply.locator("p")).not.toHaveText(/^\s*\{/);
  expect(errors).toEqual([]);
});

test("journal, skills, duplication, backup, and deletion controls are usable", async ({ page }) => {
  const frame = await openApp(page);
  await createMockAdventure(frame);
  await frame.getByRole("link", { name: /Frame the Story/ }).click();
  await frame.locator(".criteria-checks input").evaluateAll((nodes) => nodes.forEach((node) => node.click()));
  await frame.getByLabel(/Your work or learning material/).fill("Six-shot paper edit: location, interview, detail, action, reaction, consequence.");
  await frame.getByLabel("What did you do or change?").fill("I created a complete paper edit and documented the visible purpose of each selected shot.");
  await frame.getByLabel(/What felt difficult or surprising/).fill("The strongest improvement came from removing a repeated setup shot.");
  await frame.getByRole("button", { name: "Review my work" }).click();
  await frame.getByRole("dialog").getByRole("button", { name: "Review feedback" }).evaluate((button) => button.click());

  await frame.getByRole("link", { name: /Open journal/ }).click();
  await expect(frame.getByRole("heading", { name: "Frame the Story" })).toBeVisible();
  await frame.getByRole("button", { name: /Add a learning note/ }).evaluate((button) => button.click());
  await frame.getByLabel("Note title").fill("Pacing discovery");
  await frame.getByLabel("What should future-you remember?").fill("A shorter setup made the reaction feel more consequential.");
  await frame.getByRole("button", { name: "Save field note" }).click();
  await expect(frame.getByRole("heading", { name: "Pacing discovery" })).toBeVisible();

  await frame.getByRole("link", { name: "Progress" }).first().evaluate((link) => link.click());
  const firstSpark = frame.locator(".badge", { hasText: "First spark" });
  await expect(firstSpark).toContainText("Earned");

  await frame.getByRole("link", { name: "Plans" }).first().evaluate((link) => link.click());
  await frame.getByRole("button", { name: /More actions/ }).click();
  await frame.getByRole("button", { name: /Duplicate fresh adventure/ }).click();
  await expect(frame.getByText("0/12", { exact: true })).toBeVisible();
  await frame.getByRole("link", { name: "Plans" }).first().evaluate((link) => link.click());
  await expect(frame.locator(".library-row")).toHaveCount(2);

  await frame.getByRole("link", { name: "Settings", exact: true }).evaluate((link) => link.click());
  const download = page.waitForEvent("download");
  await frame.getByRole("button", { name: /Export JSON backup/ }).click();
  expect((await download).suggestedFilename()).toMatch(/^skillquest-backup-.*\.json$/);
  await frame.getByText("Reduce motion").click();
  await expect(frame.locator("html")).toHaveAttribute("data-reduce-motion", "true");
});

test("validation errors preserve the creation flow", async ({ page }) => {
  const frame = await openApp(page);
  await frame.getByRole("link", { name: /Build my practice path/ }).click();
  await frame.getByRole("button", { name: /Let Anna build my path/ }).click();
  await expect(frame.getByText("Describe what you want to learn in a little more detail.")).toBeVisible();
  await expect(frame.getByRole("heading", { name: /What do you want to learn or become able to do/ })).toBeVisible();
});

test("home and creation views pass automated accessibility scans", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const frame = await openApp(page);
  const appFrame = page.frames().find((candidate) => candidate.url().includes("/anna-apps/"));
  expect(appFrame).toBeTruthy();
  await appFrame.addScriptTag({ path: resolve("node_modules/axe-core/axe.min.js") });
  const homeResult = await appFrame.evaluate(async () => axe.run(document));
  expect(homeResult.violations).toEqual([]);
  await frame.getByRole("link", { name: /Build my practice path/ }).click();
  const creationResult = await appFrame.evaluate(async () => axe.run(document));
  expect(creationResult.violations).toEqual([]);
});
