import test from "node:test";
import assert from "node:assert/strict";
import { materializePlan } from "../src/platform.js";

const input = {
  skill: "Product storytelling",
  currentLevel: "beginner",
  minutesPerSession: 25,
};

function compactBlueprint() {
  return {
    title: "Signal Trail",
    summary: "Build a clear product story through short, evidence-led practice.",
    world: { name: "Signal Ridge", tagline: "Make the problem impossible to miss." },
    skills: [
      ["Problem framing", "State the user struggle clearly."],
      ["Audience empathy", "Match the story to listener needs."],
      ["Story structure", "Sequence ideas for understanding."],
      ["Delivery pacing", "Use time and cadence intentionally."],
      ["Decision clarity", "End with a memorable next action."],
    ],
    stages: Array.from({ length: 4 }, (_, stageIndex) => [
      `Stage ${stageIndex + 1}`,
      "Progressive practice",
      "Apply one stronger storytelling constraint",
      ["Inspect the signal", "Build one clear sequence", "Review the audience effect"],
    ]),
  };
}

test("compact Anna blueprints expand into complete deterministic mission contracts", () => {
  const plan = materializePlan(compactBlueprint(), input);
  assert.equal(plan.stages.length, 4);
  assert.ok(plan.stages.every((stage) => stage.quests.length === 3));
  assert.equal(plan.skillTree.length, 5);
  assert.equal(plan.stages[1].quests[2].type, "boss");
  assert.equal(plan.stages[3].quests[2].type, "boss");
  assert.equal(plan.stages[0].quests[0].durationMinutes, 25);
  assert.equal(plan.stages[0].quests[0].title, "Inspect the signal");
  assert.equal(plan.stages[3].quests[2].durationMinutes, 50);
  assert.ok(plan.stages.flatMap((stage) => stage.quests).every((quest) => quest.steps.length === 3 && quest.successCriteria.length === 3));
});

test("incomplete compact blueprints are rejected before normalization", () => {
  const broken = compactBlueprint();
  broken.stages[2].pop();
  assert.throws(() => materializePlan(broken, input), /stage outline/);
});
