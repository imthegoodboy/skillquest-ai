export const STORE_KEY = "skillquest-ai/v1/store";
export const STORE_VERSION = 2;
export const MAX_ADVENTURES = 18;
export const MAX_CHAT_MESSAGES = 40;
export const MAX_JOURNAL_ENTRIES = 80;

const LEVELS = new Set(["new", "beginner", "intermediate", "advanced"]);
const PACES = new Set(["steady", "focused", "intensive"]);
const QUEST_TYPES = new Set(["mission", "side", "boss"]);

export function clamp(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min;
}

export function cleanText(value, max = 500) {
  return String(value ?? "").replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

export function createId(prefix = "item") {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}

function dateIso(value, fallback = new Date().toISOString()) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function stringList(value, maxItems = 8, maxText = 300) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item, maxText)).filter(Boolean).slice(0, maxItems);
}

function deepCopy(value) {
  return globalThis.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

export function deriveSkillFromGoal(value) {
  const firstThought = cleanText(value, 800).split(/[.!?\n]/)[0]
    .replace(/^(?:please\s+)?(?:help me\s+)?(?:i(?:'d| would)? like to\s+|i want to\s+|my goal is to\s+|learn(?: how)? to\s+|become able to\s+)/i, "")
    .trim();
  return cleanText(firstThought, 100);
}

export function normalizeAdventureInput(raw = {}) {
  const legacyGoal = [raw.skill, raw.targetOutcome].map((item) => cleanText(item, 360)).filter(Boolean).join(": ");
  const goal = cleanText(raw.goal, 800) || legacyGoal;
  const skill = cleanText(raw.skill, 100) || deriveSkillFromGoal(goal);
  const targetOutcome = cleanText(raw.targetOutcome, 800) || goal;
  return {
    goal,
    skill,
    title: cleanText(raw.title, 100) || (skill ? `${skill} quest` : "Untitled quest"),
    targetOutcome: targetOutcome || (skill ? `Create a concrete result that demonstrates practical ${skill} ability.` : "Create a concrete result that demonstrates the skill."),
    motivation: cleanText(raw.motivation, 800),
    sourceMaterial: cleanText(raw.sourceMaterial, 5000),
    sourceLabel: cleanText(raw.sourceLabel, 120),
    currentLevel: LEVELS.has(raw.currentLevel) ? raw.currentLevel : "beginner",
    pace: PACES.has(raw.pace) ? raw.pace : "steady",
    minutesPerSession: clamp(raw.minutesPerSession, 10, 180),
    sessionsPerWeek: clamp(raw.sessionsPerWeek, 1, 7),
    durationWeeks: clamp(raw.durationWeeks, 2, 16),
    preferredPractice: cleanText(raw.preferredPractice, 240),
  };
}

function fallbackQuest(input, stageIndex, questIndex, type, title, focus) {
  const skill = input.skill || "this skill";
  const outcome = input.targetOutcome || `demonstrate practical ${skill} ability`;
  const isBoss = type === "boss";
  const materialLabel = input.sourceLabel || "your supplied learning material";
  const xp = isBoss ? 240 : 90 + stageIndex * 20 + questIndex * 10;
  return {
    id: createId("quest"),
    type,
    title: `${title}: ${skill}`.slice(0, 110),
    objective: isBoss
      ? `Produce and explain a complete result that moves you toward: ${outcome}`
      : `${focus} through a small, observable ${skill} practice session.`,
    brief: isBoss
      ? `Combine the strongest parts of your previous practice into one coherent demonstration. Keep the scope small enough to finish and strong enough to review honestly.`
      : input.sourceMaterial
        ? `Use ${materialLabel} as the source of truth. Work in one focused session, point to the part you used, and capture what changed in your understanding or output.`
        : `Work in one focused session. Capture what you attempted, what happened, and what you would change on the next repetition.`,
    lesson: {
      principle: isBoss ? "Integration reveals real capability" : "Short feedback loops beat passive familiarity",
      explanation: isBoss
        ? `A finished demonstration exposes how well separate ${skill} decisions work together under a real constraint.`
        : `Ability grows when you attempt a bounded task, inspect the result, and immediately adjust the next attempt.`,
      example: isBoss
        ? `Choose one realistic use case, define what success looks like, build the result, then explain the decisions behind it.`
        : `Set a fifteen-to-${input.minutesPerSession}-minute constraint, complete one observable rep, and record one improvement.`,
    },
    durationMinutes: isBoss ? Math.min(180, input.minutesPerSession * 2) : input.minutesPerSession,
    xp,
    skills: [focus, skill].map((item) => cleanText(item, 60)).filter(Boolean).slice(0, 2),
    steps: [
      input.sourceMaterial ? `Choose the exact passage, component, or output in ${materialLabel} that this session will address.` : `Define one visible result for this ${skill} session.`,
      isBoss ? "Build the complete result without hiding unfinished parts." : "Complete one focused attempt before consuming more information.",
      "Compare the result with the success criteria and record the next adjustment.",
    ],
    successCriteria: [
      "A concrete result or evidence of practice exists.",
      "The learner can explain at least one decision made during the work.",
      isBoss ? "The result connects the main abilities trained in earlier stages." : "One specific improvement for the next attempt is recorded.",
    ],
    reflectionPrompt: isBoss
      ? `What does this final result prove about your ${skill} ability, and what still needs deliberate practice?`
      : "What became easier, what remained uncertain, and what will you change on the next repetition?",
  };
}

export function buildFallbackPlan(rawInput = {}) {
  const input = normalizeAdventureInput(rawInput);
  const stageSpecs = [
    {
      title: "Orientation",
      theme: "Find the trail",
      summary: `Clarify what useful ${input.skill || "skill"} ability looks like and complete the first controlled repetitions.`,
      quests: [
        ["mission", "Map the terrain", "Define the essential vocabulary, constraints, and quality signals"],
        ["mission", "First controlled rep", "Turn one foundational idea into visible action"],
        ["side", "Close the feedback loop", "Compare an attempt with clear success criteria"],
      ],
    },
    {
      title: "Practice Range",
      theme: "Build reliable control",
      summary: `Repeat the important ${input.skill || "skill"} moves under useful constraints instead of only collecting information.`,
      quests: [
        ["mission", "Train under constraint", "Practise a core move with a time, scope, or quality limit"],
        ["mission", "Repeat with intent", "Use feedback to improve the next repetition"],
        ["boss", "Milestone trial", "Combine the first abilities in a small finished artifact"],
      ],
    },
    {
      title: "Field Work",
      theme: "Make it hold up",
      summary: `Use ${input.skill || "the skill"} in a realistic scenario, explain choices, and recover from imperfect results.`,
      quests: [
        ["mission", "Raise the difficulty", "Apply the skill with one realistic complication"],
        ["mission", "Explain the craft", "Make reasoning visible enough for another person to follow"],
        ["side", "Recovery drill", "Diagnose and improve an imperfect attempt"],
      ],
    },
    {
      title: "Summit",
      theme: "Prove the outcome",
      summary: `Turn the accumulated practice into the concrete outcome that started this ${input.skill || "learning"} adventure.`,
      quests: [
        ["mission", "Real-world simulation", "Complete the work under conditions close to actual use"],
        ["mission", "Polish the proof", "Refine the strongest artifact using the full success criteria"],
        ["boss", "Final boss", "Deliver, explain, and review the target outcome"],
      ],
    },
  ];

  return {
    title: input.title,
    summary: `A ${input.durationWeeks}-week path from ${input.currentLevel} foundations to a concrete ${input.skill || "skill"} result.`,
    world: {
      name: input.skill ? `The ${input.skill} Frontier` : "The Learning Frontier",
      tagline: input.motivation || `Build ability through evidence, reflection, and deliberate repetition.`,
    },
    stages: stageSpecs.map((stage, stageIndex) => ({
      id: createId("stage"),
      title: stage.title,
      theme: stage.theme,
      summary: stage.summary,
      quests: stage.quests.map(([type, title, focus], questIndex) => fallbackQuest(input, stageIndex, questIndex, type, title, focus)),
    })),
    skillTree: [
      { id: createId("skill"), name: `${input.skill || "Skill"} foundations`, description: "Essential concepts and quality signals." },
      { id: createId("skill"), name: "Deliberate practice", description: "Turning feedback into a stronger next repetition." },
      { id: createId("skill"), name: "Applied craft", description: "Using the skill under realistic constraints." },
      { id: createId("skill"), name: "Self-review", description: "Explaining decisions and identifying the next adjustment." },
      { id: createId("skill"), name: "Independent delivery", description: "Completing a useful result without hidden gaps." },
    ],
  };
}

function normalizeLesson(raw, fallback) {
  return {
    principle: cleanText(raw?.principle, 140) || fallback.principle,
    explanation: cleanText(raw?.explanation, 1200) || fallback.explanation,
    example: cleanText(raw?.example, 900) || fallback.example,
  };
}

function normalizeQuest(raw, fallback) {
  const type = QUEST_TYPES.has(raw?.type) ? raw.type : fallback.type;
  return {
    id: cleanText(raw?.id, 100) || fallback.id || createId("quest"),
    type,
    title: cleanText(raw?.title, 110) || fallback.title,
    objective: cleanText(raw?.objective, 700) || fallback.objective,
    brief: cleanText(raw?.brief, 1600) || fallback.brief,
    lesson: normalizeLesson(raw?.lesson, fallback.lesson),
    durationMinutes: clamp(raw?.durationMinutes ?? fallback.durationMinutes, 10, 180),
    xp: clamp(raw?.xp ?? fallback.xp, 50, type === "boss" ? 300 : 180),
    skills: stringList(raw?.skills, 4, 60).length ? stringList(raw.skills, 4, 60) : fallback.skills,
    steps: stringList(raw?.steps, 6, 320).length >= 2 ? stringList(raw.steps, 6, 320) : fallback.steps,
    successCriteria: stringList(raw?.successCriteria, 6, 320).length >= 2 ? stringList(raw.successCriteria, 6, 320) : fallback.successCriteria,
    reflectionPrompt: cleanText(raw?.reflectionPrompt, 500) || fallback.reflectionPrompt,
    completed: Boolean(raw?.completed),
    completedAt: raw?.completedAt ? dateIso(raw.completedAt) : null,
    proof: cleanText(raw?.proof, 6000),
    workMaterial: cleanText(raw?.workMaterial, 5000),
    reflection: cleanText(raw?.reflection, 3000),
    checks: Array.isArray(raw?.checks) ? raw.checks.slice(0, 8).map(Boolean) : [],
    evaluation: raw?.evaluation ? normalizeEvaluation(raw.evaluation) : null,
  };
}

function normalizeSkill(raw, fallback) {
  return {
    id: cleanText(raw?.id, 100) || fallback.id || createId("skill"),
    name: cleanText(raw?.name, 80) || fallback.name,
    description: cleanText(raw?.description, 420) || fallback.description,
    xp: clamp(raw?.xp, 0, 100000),
  };
}

export function normalizeGeneratedPlan(raw, rawInput = {}) {
  const fallback = buildFallbackPlan(rawInput);
  const input = normalizeAdventureInput(rawInput);
  const stages = fallback.stages.map((fallbackStage, stageIndex) => {
    const modelStage = Array.isArray(raw?.stages) ? raw.stages[stageIndex] : null;
    return {
      id: cleanText(modelStage?.id, 100) || fallbackStage.id,
      title: cleanText(modelStage?.title, 90) || fallbackStage.title,
      theme: cleanText(modelStage?.theme, 120) || fallbackStage.theme,
      summary: cleanText(modelStage?.summary, 700) || fallbackStage.summary,
      quests: fallbackStage.quests.map((fallbackQuestValue, questIndex) => {
        const modelQuest = Array.isArray(modelStage?.quests) ? modelStage.quests[questIndex] : null;
        return normalizeQuest(modelQuest, fallbackQuestValue);
      }),
    };
  });

  const modelSkills = Array.isArray(raw?.skillTree) ? raw.skillTree : [];
  const skillTree = fallback.skillTree.map((item, index) => normalizeSkill(modelSkills[index], item));
  const finalQuest = stages.at(-1).quests.at(-1);
  finalQuest.type = "boss";
  finalQuest.xp = Math.max(220, finalQuest.xp);

  return {
    title: cleanText(raw?.title, 100) || input.title,
    summary: cleanText(raw?.summary, 900) || fallback.summary,
    world: {
      name: cleanText(raw?.world?.name, 90) || fallback.world.name,
      tagline: cleanText(raw?.world?.tagline, 240) || fallback.world.tagline,
    },
    stages,
    skillTree,
  };
}

export function createAdventure(rawInput, rawPlan, source = "local") {
  const input = normalizeAdventureInput(rawInput);
  const plan = normalizeGeneratedPlan(rawPlan, input);
  const now = new Date().toISOString();
  return {
    id: createId("adventure"),
    title: plan.title,
    goal: input.goal,
    skill: input.skill,
    targetOutcome: input.targetOutcome,
    motivation: input.motivation,
    sourceMaterial: input.sourceMaterial,
    sourceLabel: input.sourceLabel,
    currentLevel: input.currentLevel,
    pace: input.pace,
    minutesPerSession: input.minutesPerSession,
    sessionsPerWeek: input.sessionsPerWeek,
    durationWeeks: input.durationWeeks,
    preferredPractice: input.preferredPractice,
    summary: plan.summary,
    world: plan.world,
    stages: plan.stages,
    skillTree: plan.skillTree,
    planSource: source === "anna" ? "anna" : "local",
    createdAt: now,
    updatedAt: now,
    status: "active",
    stats: { xp: 0, streak: 0, bestStreak: 0, completedQuests: 0, bossWins: 0, lastActiveDate: null },
    chat: [],
    journal: [],
  };
}

export function flattenQuests(adventure) {
  return (adventure?.stages || []).flatMap((stage, stageIndex) => (stage.quests || []).map((quest, questIndex) => ({
    ...quest,
    stageId: stage.id,
    stageTitle: stage.title,
    stageIndex,
    questIndex,
  })));
}

export function getQuestStatus(adventure, questId) {
  const quests = flattenQuests(adventure);
  const index = quests.findIndex((quest) => quest.id === questId);
  if (index < 0) return "missing";
  if (quests[index].completed) return "completed";
  const firstIncomplete = quests.findIndex((quest) => !quest.completed);
  return index === firstIncomplete ? "available" : "locked";
}

export function getActiveQuest(adventure) {
  return flattenQuests(adventure).find((quest) => !quest.completed) || flattenQuests(adventure).at(-1) || null;
}

export function getProgress(adventure) {
  const quests = flattenQuests(adventure);
  const completed = quests.filter((quest) => quest.completed).length;
  const earnedXp = quests.filter((quest) => quest.completed).reduce((sum, quest) => sum + quest.xp, 0);
  const totalXp = quests.reduce((sum, quest) => sum + quest.xp, 0);
  return {
    completed,
    total: quests.length,
    percent: quests.length ? Math.round((completed / quests.length) * 100) : 0,
    earnedXp,
    totalXp,
  };
}

export function levelFromXp(xp) {
  const safe = Math.max(0, Number(xp) || 0);
  return Math.floor(Math.sqrt(safe / 180)) + 1;
}

export function levelProgress(xp) {
  const level = levelFromXp(xp);
  const start = 180 * (level - 1) ** 2;
  const end = 180 * level ** 2;
  const into = Math.max(0, xp - start);
  return { level, into, needed: end - start, percent: Math.round((into / Math.max(1, end - start)) * 100) };
}

function dayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function dayDifference(previous, next) {
  const a = Date.parse(`${previous}T00:00:00Z`);
  const b = Date.parse(`${next}T00:00:00Z`);
  return Number.isFinite(a) && Number.isFinite(b) ? Math.round((b - a) / 86400000) : null;
}

export function normalizeEvaluation(raw = {}) {
  return {
    score: clamp(raw.score, 0, 100),
    verdict: cleanText(raw.verdict, 100) || "Progress reviewed",
    feedback: cleanText(raw.feedback, 1400) || "The submitted evidence was recorded. Use the success criteria to choose the next improvement.",
    strengths: stringList(raw.strengths, 4, 320),
    nextSteps: stringList(raw.nextSteps, 4, 320),
    source: raw.source === "anna" ? "anna" : "local",
    createdAt: dateIso(raw.createdAt),
  };
}

export function isCompleteEvaluation(raw) {
  return Boolean(
    raw && Number.isFinite(Number(raw.score)) && cleanText(raw.verdict, 100) && cleanText(raw.feedback, 1400)
    && Array.isArray(raw.strengths) && raw.strengths.length
    && Array.isArray(raw.nextSteps) && raw.nextSteps.length,
  );
}

export function buildFallbackEvaluation(quest, submission = {}) {
  const proof = cleanText(submission.proof, 6000);
  const workMaterial = cleanText(submission.workMaterial, 5000);
  const reflection = cleanText(submission.reflection, 3000);
  const checks = Array.isArray(submission.checks) ? submission.checks.map(Boolean) : [];
  const met = checks.filter(Boolean).length;
  const criteriaTotal = Math.max(1, quest?.successCriteria?.length || checks.length || 1);
  const evidenceScore = Math.min(22, Math.round((proof.length + workMaterial.length) / 30));
  const reflectionScore = Math.min(18, Math.round(reflection.length / 24));
  const criteriaScore = Math.round((met / criteriaTotal) * 35);
  const score = clamp(30 + evidenceScore + reflectionScore + criteriaScore, 35, 94);
  const unmet = quest?.successCriteria?.find((_, index) => !checks[index]);
  return normalizeEvaluation({
    score,
    verdict: score >= 80 ? "Quest cleared with strong evidence" : score >= 62 ? "Quest cleared—one more pass will sharpen it" : "Progress recorded—strengthen the proof",
    feedback: `Your submission records ${met} of ${criteriaTotal} success criteria for “${cleanText(quest?.title, 110)}”. The evidence and reflection are saved; this local review measures completeness, not expert mastery.`,
    strengths: [
      workMaterial ? "You supplied real work for the review, so the feedback can stay anchored to an inspectable artifact." : proof ? "You captured concrete evidence instead of marking the mission complete without a trail." : "You completed a structured review of the mission.",
      reflection ? "You named what changed during the attempt, which makes the next repetition more useful." : "The success criteria give the next attempt a clear target.",
    ],
    nextSteps: [
      unmet ? `Strengthen this criterion next: ${unmet}` : `Repeat the strongest part once under a slightly tighter constraint.`,
      `Keep the next adjustment specific enough to test in one ${quest?.durationMinutes || 30}-minute session.`,
    ],
    source: "local",
  });
}

export function completeQuest(adventureValue, questId, submission = {}, rawEvaluation = null, at = new Date()) {
  const adventure = deepCopy(adventureValue);
  let target = null;
  for (const stage of adventure.stages || []) {
    const quest = stage.quests.find((item) => item.id === questId);
    if (quest) {
      target = quest;
      break;
    }
  }
  if (!target) throw new Error("Quest not found.");
  if (getQuestStatus(adventure, questId) === "locked") throw new Error("Complete the active quest before opening this one.");
  if (target.completed) return adventure;

  const evaluation = rawEvaluation ? normalizeEvaluation(rawEvaluation) : buildFallbackEvaluation(target, submission);
  target.proof = cleanText(submission.proof, 6000);
  target.workMaterial = cleanText(submission.workMaterial, 5000);
  target.reflection = cleanText(submission.reflection, 3000);
  target.checks = Array.isArray(submission.checks) ? submission.checks.slice(0, target.successCriteria.length).map(Boolean) : [];
  target.evaluation = evaluation;
  target.completed = true;
  target.completedAt = at.toISOString();

  adventure.stats = normalizeStats(adventure.stats);
  adventure.stats.xp += target.xp;
  adventure.stats.completedQuests += 1;
  if (target.type === "boss") adventure.stats.bossWins += 1;

  const today = dayKey(at);
  const previous = adventure.stats.lastActiveDate;
  const difference = previous ? dayDifference(previous, today) : null;
  if (!previous || difference === null || difference > 1 || difference < 0) adventure.stats.streak = 1;
  else if (difference === 1) adventure.stats.streak += 1;
  adventure.stats.bestStreak = Math.max(adventure.stats.bestStreak, adventure.stats.streak);
  adventure.stats.lastActiveDate = today;

  const skillNames = target.skills?.length ? target.skills : [adventure.skillTree?.[0]?.name].filter(Boolean);
  const award = Math.max(1, Math.round(target.xp / Math.max(1, skillNames.length)));
  for (const name of skillNames) {
    let skill = adventure.skillTree.find((item) => item.name.toLowerCase() === String(name).toLowerCase());
    if (!skill) {
      skill = { id: createId("skill"), name: cleanText(name, 80), description: `Evidence earned through ${adventure.skill} missions.`, xp: 0 };
      adventure.skillTree.push(skill);
    }
    skill.xp = clamp(skill.xp + award, 0, 100000);
  }

  adventure.journal.unshift({
    id: createId("journal"),
    type: "quest",
    questId: target.id,
    title: target.title,
    body: target.reflection || target.proof,
    createdAt: target.completedAt,
  });
  adventure.journal = adventure.journal.slice(0, MAX_JOURNAL_ENTRIES);
  adventure.updatedAt = at.toISOString();
  if (flattenQuests(adventure).every((quest) => quest.completed)) adventure.status = "completed";
  return adventure;
}

export function addJournalEntry(adventureValue, raw = {}) {
  const adventure = deepCopy(adventureValue);
  const title = cleanText(raw.title, 120);
  const body = cleanText(raw.body, 4000);
  if (!title || !body) throw new Error("A journal title and note are required.");
  adventure.journal.unshift({ id: createId("journal"), type: "note", title, body, createdAt: new Date().toISOString() });
  adventure.journal = adventure.journal.slice(0, MAX_JOURNAL_ENTRIES);
  adventure.updatedAt = new Date().toISOString();
  return adventure;
}

export function getBadges(adventure) {
  const progress = getProgress(adventure);
  const stats = normalizeStats(adventure?.stats);
  return [
    { id: "first-spark", name: "First spark", description: "Complete the first mission.", earned: progress.completed >= 1 },
    { id: "trail-rhythm", name: "Trail rhythm", description: "Reach a three-day streak.", earned: stats.bestStreak >= 3 },
    { id: "boss-breaker", name: "Boss breaker", description: "Clear a milestone boss battle.", earned: stats.bossWins >= 1 },
    { id: "deep-practice", name: "Deep practice", description: "Earn 1,000 XP through submitted work.", earned: stats.xp >= 1000 },
    { id: "summit", name: "Summit reached", description: "Complete every quest in an adventure.", earned: progress.total > 0 && progress.completed === progress.total },
  ];
}

function normalizeStats(raw = {}) {
  return {
    xp: clamp(raw.xp, 0, 1000000),
    streak: clamp(raw.streak, 0, 3650),
    bestStreak: clamp(raw.bestStreak, 0, 3650),
    completedQuests: clamp(raw.completedQuests, 0, 10000),
    bossWins: clamp(raw.bossWins, 0, 1000),
    lastActiveDate: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.lastActiveDate || "")) ? raw.lastActiveDate : null,
  };
}

function normalizeChat(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(-MAX_CHAT_MESSAGES).map((message) => ({
    id: cleanText(message?.id, 100) || createId("message"),
    role: message?.role === "assistant" ? "assistant" : "user",
    source: message?.source === "anna" ? "anna" : message?.role === "assistant" ? "local" : "user",
    text: cleanText(message?.text, 5000),
    createdAt: dateIso(message?.createdAt),
  })).filter((message) => message.text);
}

function normalizeJournal(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_JOURNAL_ENTRIES).map((entry) => ({
    id: cleanText(entry?.id, 100) || createId("journal"),
    type: entry?.type === "quest" ? "quest" : "note",
    questId: cleanText(entry?.questId, 100) || null,
    title: cleanText(entry?.title, 120) || "Learning note",
    body: cleanText(entry?.body, 4000),
    createdAt: dateIso(entry?.createdAt),
  })).filter((entry) => entry.body);
}

function normalizeAdventure(raw) {
  const input = normalizeAdventureInput(raw);
  const fallback = buildFallbackPlan(input);
  const plan = normalizeGeneratedPlan({
    title: raw?.title,
    summary: raw?.summary,
    world: raw?.world,
    stages: raw?.stages,
    skillTree: raw?.skillTree,
  }, input);
  return {
    id: cleanText(raw?.id, 100) || createId("adventure"),
    title: plan.title,
    goal: input.goal,
    skill: input.skill,
    targetOutcome: input.targetOutcome,
    motivation: input.motivation,
    sourceMaterial: input.sourceMaterial,
    sourceLabel: input.sourceLabel,
    currentLevel: input.currentLevel,
    pace: input.pace,
    minutesPerSession: input.minutesPerSession,
    sessionsPerWeek: input.sessionsPerWeek,
    durationWeeks: input.durationWeeks,
    preferredPractice: input.preferredPractice,
    summary: plan.summary || fallback.summary,
    world: plan.world,
    stages: plan.stages,
    skillTree: plan.skillTree,
    planSource: raw?.planSource === "anna" ? "anna" : "local",
    createdAt: dateIso(raw?.createdAt),
    updatedAt: dateIso(raw?.updatedAt || raw?.createdAt),
    status: raw?.status === "completed" ? "completed" : "active",
    stats: normalizeStats(raw?.stats),
    chat: normalizeChat(raw?.chat),
    journal: normalizeJournal(raw?.journal),
  };
}

export function defaultStore() {
  return {
    version: STORE_VERSION,
    activeAdventureId: null,
    adventures: [],
    profile: { name: "" },
    preferences: { reduceMotion: false, highContrast: false },
  };
}

export function normalizeStore(raw = {}) {
  let value = raw;
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { value = {}; }
  }
  if (!value || typeof value !== "object") value = {};
  const adventures = (Array.isArray(value.adventures) ? value.adventures : [])
    .slice(0, MAX_ADVENTURES)
    .map(normalizeAdventure);
  const requestedActive = cleanText(value.activeAdventureId, 100);
  return {
    version: STORE_VERSION,
    activeAdventureId: adventures.some((item) => item.id === requestedActive) ? requestedActive : adventures[0]?.id || null,
    adventures,
    profile: { name: cleanText(value.profile?.name, 80) },
    preferences: {
      reduceMotion: Boolean(value.preferences?.reduceMotion),
      highContrast: Boolean(value.preferences?.highContrast),
    },
  };
}

export function duplicateAdventure(adventureValue) {
  const adventure = deepCopy(adventureValue);
  const now = new Date().toISOString();
  adventure.id = createId("adventure");
  adventure.title = `${cleanText(adventure.title, 92)} copy`;
  adventure.createdAt = now;
  adventure.updatedAt = now;
  adventure.status = "active";
  adventure.stats = normalizeStats({});
  adventure.chat = [];
  adventure.journal = [];
  for (const stage of adventure.stages) {
    stage.id = createId("stage");
    for (const quest of stage.quests) {
      quest.id = createId("quest");
      quest.completed = false;
      quest.completedAt = null;
      quest.proof = "";
      quest.reflection = "";
      quest.checks = [];
      quest.evaluation = null;
    }
  }
  for (const skill of adventure.skillTree) {
    skill.id = createId("skill");
    skill.xp = 0;
  }
  return adventure;
}

export function parseStructuredJson(text) {
  const raw = cleanText(text, 100000);
  if (!raw) throw new Error("Anna returned an empty response.");
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced || raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  if (!candidate || !candidate.trim().startsWith("{")) throw new Error("No JSON object was returned.");
  const parsed = JSON.parse(candidate);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Expected one JSON object.");
  return parsed;
}

export function cleanMentorReply(value) {
  const text = cleanText(value, 5000);
  if (!text) throw new Error("Anna returned an empty reply.");
  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      const answer = cleanText(parsed?.answer || parsed?.text || parsed?.message, 5000);
      if (!answer) throw new Error("The reply did not contain a visible answer.");
      return answer;
    } catch (error) {
      throw new Error(error instanceof SyntaxError ? "The Mentor returned malformed structured data instead of a visible answer." : error.message);
    }
  }
  return text;
}

export function buildFallbackMentorReply(adventure, quest, question) {
  const prompt = cleanText(question, 1200).toLowerCase();
  const active = quest || getActiveQuest(adventure);
  if (!active) return "Create an adventure first, then I can coach you from the active mission and its saved evidence.";
  const criterion = active.successCriteria?.[0] || "produce one concrete result";
  if (/start|stuck|begin|first/.test(prompt)) {
    return `Start with the smallest visible version of “${active.title}.” For the next ten minutes, focus only on this: ${active.steps?.[0] || active.objective} Stop when you have evidence you can inspect, not when it feels perfect.`;
  }
  if (/criteria|good|quality|check|done/.test(prompt)) {
    return `Use this saved criterion as your first quality check: ${criterion} Point to the exact part of your work that supports it. If you cannot point to evidence yet, that is the next move—not a failure.`;
  }
  if (/quiz|question|test/.test(prompt)) {
    return `Try this retrieval check without looking back: explain the principle “${active.lesson?.principle || active.objective}” in your own words, then give one example from your current mission. Compare your answer with the Field Guide afterward.`;
  }
  if (/feedback|improve|weak|miss/.test(prompt)) {
    return `Review your attempt against “${criterion}.” Name one observable gap, choose one change that fits inside a ${active.durationMinutes}-minute session, and repeat only that part. Your saved reflection should describe what changed.`;
  }
  return `Keep the question anchored to the current objective: ${active.objective} Make one attempt, capture evidence, and use this reflection prompt: ${active.reflectionPrompt}`;
}

export function compactAdventureContext(adventure, quest = null) {
  const progress = getProgress(adventure);
  const active = quest || getActiveQuest(adventure);
  return {
    title: adventure.title,
    goal: adventure.goal || adventure.targetOutcome,
    skill: adventure.skill,
    targetOutcome: adventure.targetOutcome,
    level: adventure.currentLevel,
    motivation: adventure.motivation,
    learningMaterial: cleanText(adventure.sourceMaterial, 5000) || null,
    learningMaterialLabel: cleanText(adventure.sourceLabel, 120) || null,
    schedule: `${adventure.sessionsPerWeek} sessions/week, ${adventure.minutesPerSession} minutes/session`,
    progress: `${progress.completed}/${progress.total} quests, ${adventure.stats.xp} XP`,
    activeQuest: active ? {
      title: active.title,
      type: active.type,
      objective: active.objective,
      brief: active.brief,
      principle: active.lesson?.principle,
      steps: active.steps,
      successCriteria: active.successCriteria,
      workMaterial: cleanText(active.workMaterial, 5000),
      proof: cleanText(active.proof, 1400),
      reflection: cleanText(active.reflection, 900),
    } : null,
  };
}

export function formatDate(value, options = { month: "short", day: "numeric" }) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(undefined, options).format(date);
}
