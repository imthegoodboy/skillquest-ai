import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_ADVENTURES,
  buildFallbackEvaluation,
  buildFallbackMentorReply,
  buildFallbackPlan,
  cleanMentorReply,
  completeQuest,
  createAdventure,
  duplicateAdventure,
  flattenQuests,
  getBadges,
  getProgress,
  getQuestStatus,
  levelFromXp,
  normalizeGeneratedPlan,
  normalizeAdventureInput,
  normalizeStore,
  parseStructuredJson,
} from "../src/core.js";

const input = {
  skill: "Documentary video editing",
  title: "Cutcraft Trail",
  targetOutcome: "Edit and explain a complete sixty-second documentary sequence.",
  motivation: "I want to tell clearer stories for community projects.",
  currentLevel: "beginner",
  pace: "steady",
  minutesPerSession: 35,
  sessionsPerWeek: 4,
  durationWeeks: 6,
  preferredPractice: "Small hands-on edits and visual examples",
};

function adventure() {
  return createAdventure(input, buildFallbackPlan(input), "local");
}

test("fallback generation creates a complete goal-derived learning world", () => {
  const plan = buildFallbackPlan(input);
  assert.equal(plan.stages.length, 4);
  assert.ok(plan.stages.every((stage) => stage.quests.length === 3));
  assert.equal(plan.stages.at(-1).quests.at(-1).type, "boss");
  assert.equal(plan.skillTree.length, 5);
  assert.match(JSON.stringify(plan), /Documentary video editing/i);
  assert.match(JSON.stringify(plan), /sixty-second documentary sequence/i);
});

test("one natural-language goal becomes a complete backward-compatible learner profile", () => {
  const value = normalizeAdventureInput({
    goal: "I want to understand the architecture of Anna Deck well enough to trace one complete data flow.",
    sourceMaterial: "router -> session store -> renderer",
    sourceLabel: "architecture-notes.md",
  });
  assert.match(value.skill, /understand the architecture of Anna Deck/i);
  assert.match(value.targetOutcome, /trace one complete data flow/i);
  assert.equal(value.sourceLabel, "architecture-notes.md");
  assert.match(value.sourceMaterial, /session store/);
});

test("incomplete model plans are normalized without empty product screens", () => {
  const plan = normalizeGeneratedPlan({
    title: "Model title",
    world: { name: "Model world" },
    stages: [{ title: "Only stage", quests: [{ title: "Only quest" }] }],
    skillTree: [{ name: "One ability" }],
  }, input);
  assert.equal(plan.stages.length, 4);
  assert.ok(plan.stages.every((stage) => stage.quests.length === 3));
  assert.equal(plan.stages[0].quests[0].title, "Only quest");
  assert.ok(plan.stages[0].quests[0].steps.length >= 2);
  assert.ok(plan.stages[0].quests[0].successCriteria.length >= 2);
  assert.equal(plan.skillTree.length, 5);
});

test("quest unlocking is sequential and completion awards XP exactly once", () => {
  let value = adventure();
  const quests = flattenQuests(value);
  assert.equal(getQuestStatus(value, quests[0].id), "available");
  assert.equal(getQuestStatus(value, quests[1].id), "locked");
  const submission = { proof: "I produced a complete annotated edit and saved the timeline for review.", reflection: "The opening cut needed a clearer visual reason.", checks: [true, true, true] };
  value = completeQuest(value, quests[0].id, submission, null, new Date("2026-08-20T10:00:00Z"));
  assert.equal(getQuestStatus(value, quests[0].id), "completed");
  assert.equal(getQuestStatus(value, quests[1].id), "available");
  assert.equal(value.stats.xp, quests[0].xp);
  const duplicateCompletion = completeQuest(value, quests[0].id, submission, null, new Date("2026-08-20T12:00:00Z"));
  assert.equal(duplicateCompletion.stats.xp, quests[0].xp);
});

test("streaks advance by learning day and keep the best streak", () => {
  let value = adventure();
  const quests = flattenQuests(value);
  const submission = { proof: "A concrete practice artifact with notes and visible iteration was completed.", reflection: "The second attempt was more deliberate than the first.", checks: [true, true, true] };
  value = completeQuest(value, quests[0].id, submission, null, new Date("2026-08-20T10:00:00Z"));
  value = completeQuest(value, quests[1].id, submission, null, new Date("2026-08-21T10:00:00Z"));
  value = completeQuest(value, quests[2].id, submission, null, new Date("2026-08-21T15:00:00Z"));
  assert.equal(value.stats.streak, 2);
  assert.equal(value.stats.bestStreak, 2);
  assert.equal(value.stats.completedQuests, 3);
});

test("local evidence evaluation stays transparent and reacts to completeness", () => {
  const quest = flattenQuests(adventure())[0];
  const weak = buildFallbackEvaluation(quest, { proof: "short evidence", reflection: "brief note", checks: [false, false, false] });
  const strong = buildFallbackEvaluation(quest, { proof: "I completed a concrete result, recorded decisions, compared it with the criteria, and documented a second improved repetition.", reflection: "The first attempt exposed weak pacing. I changed one transition and can explain why the second attempt works better.", checks: [true, true, true] });
  assert.equal(weak.source, "local");
  assert.equal(strong.source, "local");
  assert.ok(strong.score > weak.score);
  assert.ok(strong.strengths.length >= 2);
  assert.ok(strong.nextSteps.length >= 2);
});

test("submitted learner material is preserved and improves the grounded local review", () => {
  const value = adventure();
  const quest = flattenQuests(value)[0];
  const submission = {
    workMaterial: "export function route(input) { return normalize(input); }",
    proof: "I traced the input into normalize and annotated the returned value.",
    reflection: "The boundary validation was the part I initially missed.",
    checks: [true, true, true],
  };
  const updated = completeQuest(value, quest.id, submission);
  const saved = flattenQuests(updated)[0];
  assert.match(saved.workMaterial, /normalize/);
  assert.match(saved.evaluation.strengths.join(" "), /real work|inspectable artifact/i);
});

test("progress, levels, and badges are derived from submitted work", () => {
  let value = adventure();
  const first = flattenQuests(value)[0];
  const submission = { proof: "I completed and saved a visible practice artifact with an annotated review.", reflection: "I will reduce the scope before the next repetition.", checks: [true, true, true] };
  value = completeQuest(value, first.id, submission, null, new Date("2026-08-20T10:00:00Z"));
  const progress = getProgress(value);
  assert.equal(progress.completed, 1);
  assert.equal(progress.total, 12);
  assert.ok(levelFromXp(value.stats.xp) >= 1);
  assert.equal(getBadges(value).find((badge) => badge.id === "first-spark").earned, true);
});

test("duplicate adventures preserve the map but reset every completion", () => {
  let value = adventure();
  const first = flattenQuests(value)[0];
  value = completeQuest(value, first.id, { proof: "A complete visible practice result was saved with supporting notes.", reflection: "The constraint improved focus and exposed the next gap.", checks: [true, true, true] });
  const copy = duplicateAdventure(value);
  assert.notEqual(copy.id, value.id);
  assert.match(copy.title, /copy$/);
  assert.equal(copy.stats.xp, 0);
  assert.equal(getProgress(copy).completed, 0);
  assert.ok(flattenQuests(copy).every((quest) => !quest.proof && !quest.evaluation));
});

test("stored data is bounded and malformed preferences are normalized", () => {
  const adventures = Array.from({ length: MAX_ADVENTURES + 5 }, (_, index) => ({ ...adventure(), id: `adventure-${index}`, title: `World ${index}` }));
  const store = normalizeStore({ adventures, activeAdventureId: "missing", preferences: { reduceMotion: "yes", highContrast: 0 }, profile: { name: "  Learner  " } });
  assert.equal(store.adventures.length, MAX_ADVENTURES);
  assert.equal(store.activeAdventureId, store.adventures[0].id);
  assert.equal(store.profile.name, "Learner");
  assert.equal(store.preferences.reduceMotion, true);
  assert.equal(store.preferences.highContrast, false);
});

test("structured parser accepts fenced JSON and rejects prose", () => {
  assert.deepEqual(parseStructuredJson("```json\n{\"title\":\"Trail\"}\n```"), { title: "Trail" });
  assert.throws(() => parseStructuredJson("Here is a plan without JSON."), /No JSON object/);
});

test("Mentor fallback stays grounded in the active mission", () => {
  const value = adventure();
  const quest = flattenQuests(value)[0];
  const reply = buildFallbackMentorReply(value, quest, "How do I know when this is good enough?");
  assert.match(reply, new RegExp(quest.successCriteria[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(reply, /according to research|experts say/i);
});

test("Mentor formatting rejects mismatched or truncated structured output", () => {
  assert.throws(() => cleanMentorReply('{"title":"A plan","stages":['), /structured data/);
  assert.throws(() => cleanMentorReply('{"title":"A complete but wrong plan"}'), /visible answer/);
  assert.equal(cleanMentorReply('{"answer":"Start with one small attempt."}'), "Start with one small attempt.");
});
