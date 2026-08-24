import {
  MAX_ADVENTURES,
  addJournalEntry,
  buildFallbackEvaluation,
  buildFallbackMentorReply,
  buildFallbackPlan,
  cleanText,
  completeQuest,
  createAdventure,
  createId,
  defaultStore,
  duplicateAdventure,
  flattenQuests,
  formatDate,
  getActiveQuest,
  getBadges,
  getProgress,
  getQuestStatus,
  levelProgress,
  normalizeAdventureInput,
  normalizeStore,
} from "./core.js";
import { SkillQuestPlatform } from "./platform.js";

const app = document.getElementById("app");
const modalRoot = document.getElementById("modal-root");
const toastRoot = document.getElementById("toast-root");

const state = {
  platform: new SkillQuestPlatform(),
  store: defaultStore(),
  ready: false,
  creating: false,
  evaluatingQuestId: null,
  mentorBusy: false,
  mentorDraft: "",
  creationDraft: {
    goal: "",
    skill: "",
    title: "",
    targetOutcome: "",
    motivation: "",
    sourceMaterial: "",
    sourceLabel: "",
    currentLevel: "beginner",
    pace: "steady",
    minutesPerSession: 30,
    sessionsPerWeek: 4,
    durationWeeks: 6,
    preferredPractice: "",
  },
  missionDrafts: {},
  libraryQuery: "",
  journalQuery: "",
  saveTimer: null,
  storageNotified: false,
};

const ICONS = {
  home: '<path d="M4 10.5 12 4l8 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5Z"/><path d="M9 20v-6h6v6"/>',
  map: '<path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2Z"/><path d="M9 4v14M15 6v14"/>',
  spark: '<path d="m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7Z"/><path d="m18 15 .9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9Z"/>',
  tree: '<path d="M12 20v-7M12 13 7 8M12 13l5-5M7 8V4M17 8V4M4 20h16"/><circle cx="7" cy="4" r="2"/><circle cx="17" cy="4" r="2"/>',
  journal: '<path d="M6 3h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1Z"/><path d="M7 19a2 2 0 0 1 0-4h12M9 7h6M9 10h5"/>',
  library: '<path d="M5 4h13a1 1 0 0 1 1 1v15H6a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1Z"/><path d="M7 20a2 2 0 0 1 0-4h12"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  flag: '<path d="M5 21V4m0 1h11l-2 4 2 4H5"/>',
  bolt: '<path d="m13 2-8 12h7l-1 8 8-12h-7Z"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-3-1.5-5.5-4.5-8-.2 2-1.2 3.2-2.3 4.2.2-3.7-1.7-6.2-4.2-8.2.1 3-1.2 5-2.4 6.8C4.5 11.3 4 13 4 15c0 4 3.5 7 8 7Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m15 9 6-6M17 3h4v4"/>',
  message: '<path d="M4 5h16v11H8l-4 4Z"/><path d="M8 9h8M8 12h5"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M5 20h14"/>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  upload: '<path d="M12 21V9m-4 4 4-4 4 4M5 4h14"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
  crown: '<path d="m4 7 4 5 4-8 4 8 4-5-2 11H6Z"/><path d="M7 21h10"/>',
  note: '<path d="M5 3h11l3 3v15H5Z"/><path d="M16 3v4h3M8 11h8M8 15h6"/>',
};

function icon(name, label = "") {
  const body = ICONS[name] || ICONS.spark;
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" ${label ? `role="img" aria-label="${attr(label)}"` : 'aria-hidden="true"'}>${body}</svg>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function attr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function route() {
  const parts = (location.hash.replace(/^#\/?/, "") || "home").split("/").filter(Boolean);
  return { name: parts[0] || "home", adventureId: parts[1] || null, section: parts[2] || null, itemId: parts[3] || null };
}

function adventureById(id) {
  return state.store.adventures.find((adventure) => adventure.id === id) || null;
}

function activeAdventure() {
  return adventureById(state.store.activeAdventureId) || state.store.adventures[0] || null;
}

function activeUrl(section = "map", itemId = "") {
  const adventure = activeAdventure();
  return adventure ? `#/adventure/${adventure.id}/${section}${itemId ? `/${itemId}` : ""}` : "#/new";
}

function replaceAdventure(adventure) {
  const index = state.store.adventures.findIndex((item) => item.id === adventure.id);
  if (index >= 0) state.store.adventures[index] = adventure;
  else state.store.adventures.unshift(adventure);
  state.store.activeAdventureId = adventure.id;
}

async function saveNow() {
  state.store = normalizeStore(state.store);
  await state.platform.save(state.store);
  if (state.platform.storageWarning && !state.storageNotified) {
    state.storageNotified = true;
    toast("Anna Storage was unavailable, so this session is safely using this device.", "default", 7000);
  }
}

function queueSave() {
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(() => saveNow().catch(() => toast("Progress could not be saved. Retry after checking Anna Storage.", "error")), 350);
}

function navLink(href, name, label, current) {
  return `<a href="${href}" class="nav-item ${current ? "is-current" : ""}" ${current ? 'aria-current="page"' : ""}><span>${icon(name)}</span><em>${label}</em></a>`;
}

function shell(content, options = {}) {
  const currentRoute = route();
  const adventure = options.adventure || activeAdventure();
  const level = adventure ? levelProgress(adventure.stats.xp) : { level: 1, percent: 0 };
  const activeId = adventure?.id;
  const mapHref = activeId ? `#/adventure/${activeId}/map` : "#/new";
  const mentorHref = activeId ? `#/adventure/${activeId}/mentor` : "#/new";
  const skillsHref = activeId ? `#/adventure/${activeId}/skills` : "#/new";
  const current = (name) => currentRoute.name === name || (currentRoute.name === "adventure" && currentRoute.section === name);
  return `<div class="app-shell">
    <div class="ambient ambient--one" aria-hidden="true"></div><div class="ambient ambient--two" aria-hidden="true"></div>
    <aside class="island-nav" aria-label="Primary navigation">
      <a class="brand-mark" href="#/home" aria-label="SkillQuest home"><img src="./logo.svg" alt=""><span>SkillQuest</span></a>
      <nav>
        ${navLink("#/home", "home", "Home", currentRoute.name === "home")}
        ${navLink(mapHref, "map", "Path", current("map") || current("mission"))}
        ${navLink(mentorHref, "message", "Coach", current("mentor"))}
        ${navLink(skillsHref, "tree", "Progress", current("skills"))}
        ${navLink("#/library", "library", "Plans", currentRoute.name === "library")}
      </nav>
      <a href="#/settings" class="profile-orb ${currentRoute.name === "settings" ? "is-current" : ""}" aria-label="Settings"><span>${escapeHtml((state.store.profile.name || "S").slice(0, 1).toUpperCase())}</span>${icon("settings")}</a>
    </aside>
    <header class="top-island">
      <a class="top-brand" href="#/home"><img src="./logo.svg" alt=""><span>SkillQuest AI</span></a>
      <div class="sync-state"><i class="status-dot ${state.platform.connected ? "is-live" : ""}"></i><span>${state.platform.connected ? "Anna connected" : "Device preview"}</span></div>
      ${adventure ? `<a class="level-pill" href="#/adventure/${adventure.id}/skills"><span>LVL ${level.level}</span><i><b style="transform:scaleX(${level.percent / 100})"></b></i><strong>${adventure.stats.xp} XP</strong></a>` : `<a class="quiet-link" href="#/new">Begin a quest ${icon("arrow")}</a>`}
    </header>
    <main id="workspace" tabindex="-1">${content}</main>
    <nav class="mobile-nav" aria-label="Mobile navigation">
      ${navLink("#/home", "home", "Home", currentRoute.name === "home")}
      ${navLink(mapHref, "map", "Path", current("map") || current("mission"))}
      ${navLink(mentorHref, "message", "Coach", current("mentor"))}
      ${navLink(skillsHref, "tree", "Progress", current("skills"))}
      ${navLink("#/library", "library", "Plans", currentRoute.name === "library")}
    </nav>
  </div>`;
}

function button(label, href, variant = "lime", leadingIcon = null) {
  return `<a class="button button--${variant} button--nested" href="${href}">${leadingIcon ? icon(leadingIcon) : ""}<span>${label}</span><i>${icon("arrow")}</i></a>`;
}

function progressRing(percent, label = "journey") {
  return `<div class="progress-ring" style="--progress:${percent}"><div><strong>${percent}<sup>%</sup></strong><span>${label}</span></div></div>`;
}

function emptyConstellation() {
  return `<div class="empty-constellation" aria-hidden="true"><span class="trail-line trail-line--1"></span><span class="trail-line trail-line--2"></span><i class="trail-node trail-node--1"></i><i class="trail-node trail-node--2"></i><i class="trail-node trail-node--3"></i><i class="trail-star">${icon("spark")}</i><b>?</b></div>`;
}

function aiPracticePreview() {
  return `<div class="ai-practice-preview"><p><span>01</span><strong>Your goal</strong><small>Understand Anna Deck architecture</small></p><i></i><p><span>02</span><strong>AI practice path</strong><small>Specific tasks from your material</small></p><i></i><p><span>03</span><strong>Grounded feedback</strong><small>Review what you actually made</small></p></div>`;
}

function renderHome() {
  const adventure = activeAdventure();
  if (!adventure) {
    return shell(`<div class="page home-empty">
      <section class="home-hero reveal">
        <div class="hero-copy">
          <p class="eyebrow"><span></span> AI-guided learning through real practice</p>
          <h1>Turn one goal into a practice path that <em>adapts.</em></h1>
          <p class="hero-deck">Tell Anna what you want to learn. It builds practical tasks, reads the material you choose to share, and gives feedback grounded in your actual work.</p>
          <div class="hero-actions">${button("Build my practice path", "#/new")}<a class="text-action" href="#/how-it-works">See how it works ${icon("arrow")}</a></div>
          <dl class="truth-strip"><div><dt>One goal</dt><dd>start in your own words</dd></div><div><dt>Real work</dt><dd>code, notes, docs, or output</dd></div><div><dt>Grounded</dt><dd>feedback from your evidence</dd></div></dl>
        </div>
        <div class="hero-art"><div class="bezel bezel--hero"><div class="bezel-core">${aiPracticePreview()}<div class="art-caption"><span>Anna does the breakdown</span><strong>You do work that matters.</strong></div></div></div><div class="floating-token floating-token--xp"><span>${icon("note")}</span><b>Bring your own material</b></div><div class="floating-token floating-token--boss"><span>${icon("spark")}</span><b>Feedback cites your work</b></div></div>
      </section>
      <section id="how-it-works" class="learning-loop reveal"><div class="section-intro"><p class="eyebrow">The learning loop</p><h2>AI plans. You practise. Feedback adapts.</h2><p>Gamification stays in the background; progress begins with work you can inspect.</p></div><ol><li><span>01</span><div><h3>Say what you want to learn</h3><p>Start with one open-ended goal. Add code, notes, or a document excerpt only when it helps.</p></div></li><li><span>02</span><div><h3>Get a personalized practice path</h3><p>Anna breaks the goal into short, ordered tasks grounded in the context you provided.</p></div></li><li><span>03</span><div><h3>Submit real work for feedback</h3><p>Anna reviews your evidence, explains the next adjustment, and updates the path as you progress.</p></div></li></ol></section>
    </div>`);
  }

  const progress = getProgress(adventure);
  const next = getActiveQuest(adventure);
  const level = levelProgress(adventure.stats.xp);
  const recent = state.store.adventures.slice(0, 4);
  return shell(`<div class="page home-active">
    <section class="dashboard-hero reveal">
      <div class="dashboard-copy"><p class="eyebrow"><span></span>${adventure.status === "completed" ? "Practice plan completed" : "Current learning plan"}</p><h1>${escapeHtml(adventure.world.name)}</h1><p>${escapeHtml(adventure.world.tagline)}</p><div class="dashboard-actions">${next ? button(next.completed ? "Review final task" : "Continue practice", `#/adventure/${adventure.id}/mission/${next.id}`) : button("Open practice path", `#/adventure/${adventure.id}/map`)}<a class="button button--ghost" href="#/adventure/${adventure.id}/map">View full path ${icon("map")}</a></div></div>
      <div class="dashboard-orbit">${progressRing(progress.percent)}<div class="orbit-note"><span>Level ${level.level}</span><strong>${progress.completed} of ${progress.total} quests</strong><small>${progress.totalXp - progress.earnedXp} XP still on the trail</small></div></div>
    </section>
    ${next ? `<section class="today-grid reveal"><div class="today-mission bezel"><div class="bezel-core"><div class="mission-kicker"><span>${next.type === "boss" ? icon("crown") : icon("flag")}</span><p><small>Up next · ${escapeHtml(next.stageTitle)}</small><strong>${escapeHtml(next.title)}</strong></p><b>+${next.xp} XP</b></div><h2>${escapeHtml(next.objective)}</h2><p>${escapeHtml(next.brief)}</p><div class="mission-meta"><span>${icon("clock")} ${next.durationMinutes} min</span><span>${icon("target")} ${next.successCriteria.length} success checks</span></div>${button(next.type === "boss" ? "Enter the boss battle" : "Begin this mission", `#/adventure/${adventure.id}/mission/${next.id}`)}</div></div>
      <aside class="stat-cascade"><article><span>${icon("flame")}</span><div><strong>${adventure.stats.streak}</strong><small>day streak</small></div></article><article><span>${icon("bolt")}</span><div><strong>${adventure.stats.xp}</strong><small>earned XP</small></div></article><article><span>${icon("crown")}</span><div><strong>${adventure.stats.bossWins}</strong><small>boss wins</small></div></article></aside></section>` : ""}
    <section class="worlds-preview reveal"><div class="section-heading"><div><p class="eyebrow">Your worlds</p><h2>Every skill keeps its own trail.</h2></div><a class="text-action" href="#/library">Open world library ${icon("arrow")}</a></div><div class="world-strip">${recent.map((item) => worldCard(item)).join("")}<a class="new-world-tile" href="#/new">${icon("plus")}<span>Start another adventure</span><small>${state.store.adventures.length}/${MAX_ADVENTURES} saved worlds</small></a></div></section>
  </div>`, { adventure });
}

function worldCard(adventure) {
  const progress = getProgress(adventure);
  return `<article class="world-card ${adventure.id === state.store.activeAdventureId ? "is-active" : ""}"><a href="#/adventure/${adventure.id}/map" data-action="activate-adventure" data-id="${attr(adventure.id)}"><div class="world-card__sky"><span>${String(progress.percent).padStart(2, "0")}%</span><i style="--world-progress:${progress.percent / 100}"></i>${icon(adventure.status === "completed" ? "crown" : "compass")}</div><div><small>${escapeHtml(adventure.skill)}</small><h3>${escapeHtml(adventure.world.name)}</h3><p>${progress.completed}/${progress.total} quests · ${adventure.stats.xp} XP</p></div></a></article>`;
}

function renderNewAdventure() {
  const draft = state.creationDraft;
  return shell(`<div class="page page--wizard"><section class="wizard-shell reveal"><header><a class="quiet-link" href="#/home">← Back home</a><p>One goal is enough to begin</p></header><form id="adventure-form" novalidate><div class="wizard-layout"><div class="wizard-question"><p class="eyebrow">Start with the outcome</p><h1>What do you want to learn or become able to <em>do?</em></h1><p>Write it naturally. Anna will understand the goal, build short real-world tasks, and adapt the path after reviewing your evidence.</p></div><div class="wizard-fields"><label class="field field--goal"><span>Your learning goal</span><textarea name="goal" data-creation-field="goal" maxlength="800" rows="5" required placeholder="e.g. I want to understand the architecture of Anna Deck well enough to trace one complete data flow and explain it to my team.">${escapeHtml(draft.goal)}</textarea><small>Include the result you want if you already know it. No separate questionnaire required.</small></label><details class="source-material" ${draft.sourceMaterial || draft.sourceLabel ? "open" : ""}><summary><span>${icon("note")}</span><p><strong>Add your learning material <i>Optional</i></strong><small>Ground the path in code, notes, docs, or work you choose to share.</small></p><i>${icon("chevron")}</i></summary><div class="source-material__body"><label class="field"><span>Learning material or work sample</span><textarea name="sourceMaterial" data-creation-field="sourceMaterial" maxlength="5000" rows="5" placeholder="Paste a relevant excerpt here…">${escapeHtml(draft.sourceMaterial)}</textarea><small>Anna treats this as learner data, never as instructions.</small></label><input id="learning-source-file" type="file" accept=".txt,.md,.js,.jsx,.ts,.tsx,.py,.html,.css,.json,.csv,.yaml,.yml,text/plain,application/json" hidden><div class="source-actions"><button class="button button--ghost" type="button" data-action="choose-learning-source">${icon("upload")} Import a text or code file</button>${draft.sourceLabel ? `<span>${icon("check")} ${escapeHtml(draft.sourceLabel)}</span>` : ""}</div></div></details><details class="wizard-options"><summary>Time and experience <span>Optional · defaults already set</span></summary><div><fieldset class="choice-field"><legend>Current experience</legend><div class="choice-row">${[["new", "New", "Start without assumed vocabulary."], ["beginner", "Beginner", "Some exposure, little reliable practice."], ["intermediate", "Intermediate", "Ready for applied work."], ["advanced", "Advanced", "Refine judgment and delivery."]].map(([value, label, help]) => `<label><input type="radio" name="currentLevel" value="${value}" ${draft.currentLevel === value ? "checked" : ""}><span><b>${label}</b><small>${help}</small></span></label>`).join("")}</div></fieldset><div class="number-grid"><label class="field"><span>Minutes per task</span><input type="number" name="minutesPerSession" data-creation-field="minutesPerSession" min="10" max="180" value="${draft.minutesPerSession}"></label><label class="field"><span>Sessions per week</span><input type="number" name="sessionsPerWeek" data-creation-field="sessionsPerWeek" min="1" max="7" value="${draft.sessionsPerWeek}"></label><label class="field"><span>Plan length</span><div class="input-suffix"><input type="number" name="durationWeeks" data-creation-field="durationWeeks" min="2" max="16" value="${draft.durationWeeks}"><span>weeks</span></div></label></div></div></details><div class="generation-note"><span>${icon("spark")}</span><div><strong>Anna creates the first draft; you stay in control.</strong><p>Progress is awarded only after you submit evidence.</p></div></div></div></div><footer><p>Uses your Anna model access. No provider key needed.</p><button class="button button--lime button--nested" type="submit" ${state.creating ? "disabled" : ""}><span>Let Anna build my path</span><i>${icon("spark")}</i></button></footer></form></section></div>`);
}

function stageStatus(adventure, stage) {
  const completed = stage.quests.filter((quest) => quest.completed).length;
  const hasAvailable = stage.quests.some((quest) => getQuestStatus(adventure, quest.id) === "available");
  return completed === stage.quests.length ? "complete" : hasAvailable ? "active" : "locked";
}

function renderQuestMap(adventure) {
  const progress = getProgress(adventure);
  const active = getActiveQuest(adventure);
  return shell(`<div class="page page--map">
    <section class="map-hero reveal"><div><p class="eyebrow"><span></span>${escapeHtml(adventure.skill)} · ${adventure.planSource === "anna" ? "Designed by Anna" : "Local fallback map"}</p><h1>${escapeHtml(adventure.world.name)}</h1><p>${escapeHtml(adventure.summary)}</p><div class="map-hero__actions">${active ? button(active.completed ? "Review final mission" : "Continue active mission", `#/adventure/${adventure.id}/mission/${active.id}`) : ""}<a class="button button--ghost" href="#/adventure/${adventure.id}/journal">Open field journal ${icon("journal")}</a></div></div><div class="map-progress">${progressRing(progress.percent, "mapped")}<dl><div><dt>Quests cleared</dt><dd>${progress.completed}/${progress.total}</dd></div><div><dt>XP collected</dt><dd>${progress.earnedXp}/${progress.totalXp}</dd></div><div><dt>Best streak</dt><dd>${adventure.stats.bestStreak} days</dd></div></dl></div></section>
    <section class="quest-map reveal" aria-label="Quest progression map"><div class="map-axis" aria-hidden="true"></div>${adventure.stages.map((stage, stageIndex) => {
      const status = stageStatus(adventure, stage);
      return `<article class="map-stage map-stage--${status}"><header><span>Stage ${String(stageIndex + 1).padStart(2, "0")}</span><div><p>${escapeHtml(stage.theme)}</p><h2>${escapeHtml(stage.title)}</h2><small>${escapeHtml(stage.summary)}</small></div><b>${status === "complete" ? icon("check") : status === "active" ? icon("flag") : icon("lock")}</b></header><div class="quest-nodes">${stage.quests.map((quest, questIndex) => questNode(adventure, quest, questIndex)).join("")}</div></article>`;
    }).join("")}</section>
    <section class="summit-banner reveal"><span>${icon("crown")}</span><div><p class="eyebrow">The summit contract</p><h2>${escapeHtml(adventure.targetOutcome)}</h2><p>Every mission should make this outcome more achievable, more visible, or easier to explain.</p></div></section>
  </div>`, { adventure });
}

function questNode(adventure, quest, index) {
  const status = getQuestStatus(adventure, quest.id);
  const content = `<span class="node-index">${quest.type === "boss" ? icon("crown") : String(index + 1).padStart(2, "0")}</span><div><small>${quest.type === "boss" ? "Boss battle" : quest.type === "side" ? "Side quest" : "Mission"} · ${quest.durationMinutes} min</small><h3>${escapeHtml(quest.title)}</h3><p>${escapeHtml(quest.objective)}</p><em>+${quest.xp} XP</em></div><i>${status === "completed" ? icon("check") : status === "locked" ? icon("lock") : icon("arrow")}</i>`;
  return status === "locked"
    ? `<div class="quest-node quest-node--locked" aria-label="${attr(quest.title)} locked">${content}</div>`
    : `<a class="quest-node quest-node--${status} ${quest.type === "boss" ? "quest-node--boss" : ""}" href="#/adventure/${adventure.id}/mission/${quest.id}">${content}</a>`;
}

function draftForQuest(quest) {
  if (!state.missionDrafts[quest.id]) {
    state.missionDrafts[quest.id] = { workMaterial: quest.workMaterial || "", materialLabel: "", proof: quest.proof || "", reflection: quest.reflection || "", checks: quest.checks?.length ? [...quest.checks] : quest.successCriteria.map(() => false) };
  }
  return state.missionDrafts[quest.id];
}

function pathBreadcrumb(adventure, current) {
  return `<nav class="path-breadcrumb" aria-label="Breadcrumb"><a href="#/home">Home</a><span>/</span><a href="#/adventure/${adventure.id}/map">Practice path</a>${current ? `<span>/</span><em aria-current="page">${escapeHtml(current)}</em>` : ""}</nav>`;
}

function renderMission(adventure, questId) {
  const quest = flattenQuests(adventure).find((item) => item.id === questId);
  if (!quest) return renderNotFound("That mission is no longer part of this adventure.");
  const status = getQuestStatus(adventure, quest.id);
  if (status === "locked") return shell(`<div class="page message-page"><section class="message-panel reveal"><span>${icon("lock")}</span><p class="eyebrow">Trail locked</p><h1>One mission at a time.</h1><p>Complete the active quest before opening this part of the map.</p>${button("Return to quest map", `#/adventure/${adventure.id}/map`)}</section></div>`, { adventure });
  const draft = draftForQuest(quest);
  const allQuests = flattenQuests(adventure);
  const index = allQuests.findIndex((item) => item.id === quest.id);
  const next = allQuests[index + 1] || null;
  const evaluation = quest.evaluation;
  return shell(`<div class="page page--mission">
    <header class="mission-hero reveal">${pathBreadcrumb(adventure, quest.title)}<div class="mission-title"><span class="mission-emblem">${quest.type === "boss" ? icon("target") : icon("flag")}</span><div><p class="eyebrow">${quest.type === "boss" ? "Milestone task" : quest.type === "side" ? "Optional practice" : "Practice task"} · ${quest.durationMinutes} min</p><h1>${escapeHtml(quest.title)}</h1><p>${escapeHtml(quest.objective)}</p></div></div></header>
    <section class="mission-layout reveal"><div class="mission-main">
      <article class="mission-brief mission-task"><p class="eyebrow">Do this now</p><h2>Make one attempt you can inspect.</h2><p>${escapeHtml(quest.brief)}</p><ol>${quest.steps.map((step, stepIndex) => `<li><span>${String(stepIndex + 1).padStart(2, "0")}</span><p>${escapeHtml(step)}</p></li>`).join("")}</ol></article>
      <details class="field-guide field-guide--details"><summary><span>${icon("compass")}</span><div><p class="eyebrow">Why this task matters</p><h2>${escapeHtml(quest.lesson.principle)}</h2></div><i>${icon("chevron")}</i></summary><div class="field-guide__body"><p>${escapeHtml(quest.lesson.explanation)}</p><blockquote><span>Example</span>${escapeHtml(quest.lesson.example)}</blockquote></div></details>
      ${quest.completed ? completedMission(adventure, quest, next) : `<form id="mission-form" class="evidence-form"><div class="section-heading"><div><p class="eyebrow">AI feedback</p><h2>Submit your real work for review.</h2><p>Anna checks only what you share against this task. It will not invent missing evidence or claim professional mastery.</p></div></div><label class="field field--evidence"><span>Your work or learning material <i>Recommended</i></span><textarea name="workMaterial" data-mission-field="workMaterial" rows="7" maxlength="5000" placeholder="Paste the code, document excerpt, notes, output, or draft you want Anna to inspect…">${escapeHtml(draft.workMaterial)}</textarea><small>Text and code only. Never share passwords, tokens, or sensitive personal data.</small></label><input id="mission-source-file" type="file" accept=".txt,.md,.js,.jsx,.ts,.tsx,.py,.html,.css,.json,.csv,.yaml,.yml,text/plain,application/json" hidden><div class="source-actions"><button class="button button--ghost" type="button" data-action="choose-mission-source">${icon("upload")} Import text or code</button>${draft.materialLabel ? `<span>${icon("check")} ${escapeHtml(draft.materialLabel)}</span>` : ""}</div><label class="field"><span>What did you do or change?</span><textarea name="proof" data-mission-field="proof" rows="5" maxlength="6000" placeholder="Point to the decisions, result, or evidence Anna should evaluate…">${escapeHtml(draft.proof)}</textarea></label><label class="field"><span>What felt difficult or surprising? <i>Optional</i></span><textarea name="reflection" data-mission-field="reflection" rows="3" maxlength="3000" placeholder="${attr(quest.reflectionPrompt)}">${escapeHtml(draft.reflection)}</textarea></label><details class="evidence-criteria"><summary>Review the ${quest.successCriteria.length} success checks</summary><fieldset class="criteria-checks"><legend class="sr-only">Success checks</legend>${quest.successCriteria.map((criterion, criterionIndex) => `<label><input type="checkbox" name="criterion-${criterionIndex}" data-mission-check="${criterionIndex}" ${draft.checks[criterionIndex] ? "checked" : ""}><span>${icon("check")}</span><p>${escapeHtml(criterion)}</p></label>`).join("")}</fieldset></details><div class="submission-row"><p>${icon("spark")} Live Anna feedback is grounded in your submitted material; the labelled local review checks completeness only.</p><button class="button button--lime button--nested" type="submit" ${state.evaluatingQuestId ? "disabled" : ""}><span>${quest.type === "boss" ? "Review milestone" : "Review my work"}</span><i>${icon("arrow")}</i></button></div></form>`}
    </div><aside class="mission-rail"><div class="rail-card"><p class="eyebrow">Task details</p><dl><div><dt>Stage</dt><dd>${escapeHtml(quest.stageTitle)}</dd></div><div><dt>Timebox</dt><dd>${quest.durationMinutes} min</dd></div></dl><details class="rail-meta"><summary>Progress reward</summary><p>+${quest.xp} XP · ${quest.skills.map(escapeHtml).join(" · ")}</p></details></div><a class="mentor-callout" href="#/adventure/${adventure.id}/mentor"><span>${icon("message")}</span><div><strong>Ask the AI coach</strong><p>Get a hint grounded in this task and your saved material.</p></div>${icon("arrow")}</a>${evaluation ? `<div class="score-stamp"><strong>${evaluation.score}</strong><span>review score</span><small>${evaluation.source === "anna" ? "Anna" : "Local fallback"}</small></div>` : ""}</aside></section>
  </div>`, { adventure });
}

function completedMission(adventure, quest, next) {
  const evaluation = quest.evaluation || buildFallbackEvaluation(quest, quest);
  return `<section class="evaluation-sheet"><header><div><p class="eyebrow">Work review · ${evaluation.source === "anna" ? "Anna" : "Local fallback"}</p><h2>${escapeHtml(evaluation.verdict)}</h2></div><span>${evaluation.score}<small>/100</small></span></header><p>${escapeHtml(evaluation.feedback)}</p><div class="evaluation-grid"><section><h3>What worked</h3><ul>${evaluation.strengths.map((item) => `<li>${icon("check")}<span>${escapeHtml(item)}</span></li>`).join("")}</ul></section><section><h3>Next adjustments</h3><ul>${evaluation.nextSteps.map((item) => `<li>${icon("arrow")}<span>${escapeHtml(item)}</span></li>`).join("")}</ul></section></div><details><summary>Review submitted evidence</summary><div>${quest.workMaterial ? `<h3>Submitted work</h3><p>${escapeHtml(quest.workMaterial).replaceAll("\n", "<br>")}</p>` : ""}<h3>Evidence note</h3><p>${escapeHtml(quest.proof).replaceAll("\n", "<br>")}</p>${quest.reflection ? `<h3>Reflection</h3><p>${escapeHtml(quest.reflection).replaceAll("\n", "<br>")}</p>` : ""}</div></details><div class="evaluation-actions"><a class="button button--ghost" href="#/adventure/${adventure.id}/journal">Open journal ${icon("journal")}</a>${next ? button("Continue to next task", `#/adventure/${adventure.id}/mission/${next.id}`) : button("See completed path", `#/adventure/${adventure.id}/map`)}</div></section>`;
}

function mentorTime(value) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function renderMentor(adventure) {
  const quest = getActiveQuest(adventure);
  const messages = adventure.chat || [];
  const starters = quest ? [
    `Help me start ${quest.title}`,
    `Quiz me on ${quest.lesson.principle}`,
    "How should I check the success criteria?",
    "What would stronger evidence look like?",
  ] : [];
  return shell(`<div class="page page--mentor">${pathBreadcrumb(adventure, "AI coach")}<section class="mentor-header reveal"><div><p class="eyebrow"><span></span>AI learning coach</p><h1>Guidance grounded in your <em>work.</em></h1><p>Ask for a hint, retrieval check, or critique. Anna uses the active task, your goal, and the material you chose to share—never invented sources.</p></div><div class="mentor-presence"><span>${icon("spark")}</span><p><strong>${state.platform.connected ? "Anna is ready" : "Local guidance ready"}</strong><small>${state.platform.connected ? "Replies use your Anna model access" : "Open inside Anna for live coaching"}</small></p></div></section>
    <section class="mentor-layout reveal"><aside class="mentor-context"><div class="context-orb">${icon(quest?.type === "boss" ? "target" : "flag")}</div><p class="eyebrow">Active context</p>${quest ? `<h2>${escapeHtml(quest.title)}</h2><p>${escapeHtml(quest.objective)}</p><dl><div><dt>Task principle</dt><dd>${escapeHtml(quest.lesson.principle)}</dd></div><div><dt>Success checks</dt><dd>${quest.successCriteria.length}</dd></div>${adventure.sourceMaterial ? `<div><dt>Plan material</dt><dd>${escapeHtml(adventure.sourceLabel || "Shared excerpt")}</dd></div>` : ""}${quest.workMaterial ? `<div><dt>Submitted work</dt><dd>Available to Anna</dd></div>` : ""}</dl><a class="text-action" href="#/adventure/${adventure.id}/mission/${quest.id}">Open practice task ${icon("arrow")}</a>` : `<h2>The practice path is complete.</h2><p>Use the coach to review the complete trail and choose what to practise next.</p>`}<button class="quiet-danger" type="button" data-action="clear-mentor" ${messages.length ? "" : "disabled"}>Clear conversation</button></aside>
      <div class="chat-bezel"><div class="chat-core"><header><div><span class="presence-dot ${state.platform.connected ? "is-live" : ""}"></span><p><strong>SkillQuest Mentor</strong><small>${state.platform.connected ? "Grounded Anna reply" : "Transparent local fallback"}</small></p></div><span>${messages.length} messages</span></header><div id="mentor-log" class="mentor-log" aria-live="polite">${messages.length ? messages.map((message) => `<article class="mentor-message mentor-message--${message.role}"><span class="message-avatar">${message.role === "assistant" ? icon("spark") : escapeHtml((state.store.profile.name || "You").slice(0, 1).toUpperCase())}</span><div><header><strong>${message.role === "assistant" ? "Mentor" : "You"}</strong>${message.role === "assistant" && message.source === "local" ? "<em>Local fallback</em>" : ""}<time>${mentorTime(message.createdAt)}</time></header><p>${escapeHtml(message.text).replaceAll("\n", "<br>")}</p></div></article>`).join("") : `<div class="mentor-empty"><span>${icon("message")}</span><h2>What part of the trail feels foggy?</h2><p>Choose a grounded prompt or ask in your own words.</p><div>${starters.map((prompt) => `<button type="button" data-action="mentor-starter" data-question="${attr(prompt)}">${escapeHtml(prompt)}${icon("arrow")}</button>`).join("")}</div></div>`}${state.mentorBusy ? `<article class="mentor-message mentor-message--assistant is-pending"><span class="message-avatar">${icon("spark")}</span><div><header><strong>Mentor</strong><em>Reading the mission</em></header><span class="thinking-dots" aria-label="Mentor is thinking"><i></i><i></i><i></i></span></div></article>` : ""}</div><form id="mentor-form" class="mentor-composer"><label><span class="sr-only">Message the SkillQuest Mentor</span><textarea id="mentor-input" name="question" rows="1" maxlength="1200" placeholder="Ask about the active quest…" ${state.mentorBusy ? "disabled" : ""}>${escapeHtml(state.mentorDraft)}</textarea></label><div><span id="mentor-count">${state.mentorDraft.length}/1200</span><small><kbd>Ctrl</kbd> + <kbd>Enter</kbd></small><button class="button button--lime button--nested" type="submit" ${state.mentorBusy ? "disabled" : ""}><span>Send</span><i>${icon("arrow")}</i></button></div></form></div></div>
    </section></div>`, { adventure });
}

function renderSkills(adventure) {
  const level = levelProgress(adventure.stats.xp);
  const badges = getBadges(adventure);
  const maxSkillXp = Math.max(400, ...adventure.skillTree.map((skill) => skill.xp));
  return shell(`<div class="page page--skills">${pathBreadcrumb(adventure, "Progress")}<section class="skills-hero reveal"><div><p class="eyebrow"><span></span>Practice progress</p><h1>Your work is becoming <em>visible.</em></h1><p>These indicators come only from completed evidence. They show practice distribution, not a professional credential.</p></div><div class="level-monument"><span>Practice level</span><strong>${level.level}</strong><p>${level.into} / ${level.needed} XP to next level</p><i><b style="transform:scaleX(${level.percent / 100})"></b></i></div></section>
    <section class="skill-tree reveal"><div class="tree-trunk" aria-hidden="true"></div>${adventure.skillTree.map((skill, index) => `<article class="skill-branch"><span>${String(index + 1).padStart(2, "0")}</span><div><header><div><p>Ability ${String(index + 1).padStart(2, "0")}</p><h2>${escapeHtml(skill.name)}</h2></div><strong>${skill.xp} XP</strong></header><p>${escapeHtml(skill.description)}</p><div class="skill-meter"><i style="transform:scaleX(${Math.min(1, skill.xp / maxSkillXp)})"></i></div></div></article>`).join("")}</section>
    <section class="badge-vault reveal"><div class="section-heading"><div><p class="eyebrow">Badge vault</p><h2>Milestones with receipts.</h2></div><span>${badges.filter((badge) => badge.earned).length}/${badges.length} earned</span></div><div>${badges.map((badge) => `<article class="badge ${badge.earned ? "is-earned" : ""}"><span>${icon(badge.id === "summit" ? "crown" : badge.id === "trail-rhythm" ? "flame" : badge.id === "boss-breaker" ? "flag" : "spark")}</span><div><h3>${escapeHtml(badge.name)}</h3><p>${escapeHtml(badge.description)}</p></div><em>${badge.earned ? "Earned" : "Locked"}</em></article>`).join("")}</div></section>
  </div>`, { adventure });
}

function renderJournal(adventure) {
  const query = state.journalQuery.toLowerCase();
  const entries = adventure.journal.filter((entry) => !query || `${entry.title} ${entry.body}`.toLowerCase().includes(query));
  return shell(`<div class="page page--journal">${pathBreadcrumb(adventure, "Learning journal")}<section class="journal-hero reveal"><div><p class="eyebrow"><span></span>Learning journal</p><h1>Remember how the skill <em>changed.</em></h1><p>Task reflections arrive automatically. Add your own observations whenever practice reveals something worth keeping.</p></div><button class="button button--lime button--nested" type="button" data-action="open-journal-note"><span>Add a learning note</span><i>${icon("plus")}</i></button></section>
    <div class="journal-toolbar reveal"><label class="search-field">${icon("search")}<span class="sr-only">Search field journal</span><input type="search" data-journal-search placeholder="Search reflections and notes" value="${attr(state.journalQuery)}"></label><span>${entries.length} ${entries.length === 1 ? "entry" : "entries"}</span></div>
    <section class="journal-timeline reveal">${entries.length ? entries.map((entry, index) => `<article><time>${formatDate(entry.createdAt, { month: "short", day: "numeric", year: "numeric" })}</time><span class="timeline-dot">${entry.type === "quest" ? icon("flag") : icon("note")}</span><div><small>${entry.type === "quest" ? "Mission reflection" : "Field note"}</small><h2>${escapeHtml(entry.title)}</h2><p>${escapeHtml(entry.body).replaceAll("\n", "<br>")}</p>${entry.questId ? `<a class="text-action" href="#/adventure/${adventure.id}/mission/${entry.questId}">Review mission ${icon("arrow")}</a>` : ""}</div></article>`).join("") : `<div class="empty-state"><span>${icon("journal")}</span><h2>No field notes match.</h2><p>Complete a mission or write down what practice taught you.</p></div>`}</section>
  </div>`, { adventure });
}

function renderLibrary() {
  const query = state.libraryQuery.toLowerCase();
  const adventures = state.store.adventures.filter((adventure) => !query || `${adventure.title} ${adventure.skill} ${adventure.world.name}`.toLowerCase().includes(query));
  return shell(`<div class="page page--library"><section class="library-hero reveal"><div><p class="eyebrow"><span></span>World library</p><h1>Every adventure keeps its own <em>memory.</em></h1><p>Return to an active trail, review a completed summit, or duplicate a structure for a new attempt.</p></div>${state.store.adventures.length < MAX_ADVENTURES ? button("Start another quest", "#/new", "lime", "plus") : ""}</section>
    <div class="library-toolbar reveal"><label class="search-field">${icon("search")}<span class="sr-only">Search saved worlds</span><input type="search" data-library-search placeholder="Search skills and worlds" value="${attr(state.libraryQuery)}"></label><span>${state.store.adventures.length}/${MAX_ADVENTURES} worlds</span></div>
    <section class="library-list reveal">${adventures.length ? adventures.map((adventure, index) => libraryRow(adventure, index)).join("") : `<div class="empty-state"><span>${icon("compass")}</span><h2>${state.store.adventures.length ? "No worlds match that search." : "No learning worlds yet."}</h2><p>${state.store.adventures.length ? "Try a different skill or world name." : "Create an adventure and your saved trail will appear here."}</p>${state.store.adventures.length ? "" : button("Create the first world", "#/new")}</div>`}</section>
  </div>`);
}

function libraryRow(adventure, index) {
  const progress = getProgress(adventure);
  const active = getActiveQuest(adventure);
  return `<article class="library-row"><span class="library-index">${String(index + 1).padStart(2, "0")}</span><a href="#/adventure/${adventure.id}/map" data-action="activate-adventure" data-id="${attr(adventure.id)}"><div><small>${escapeHtml(adventure.skill)} · ${adventure.planSource === "anna" ? "Anna map" : "Local fallback"}</small><h2>${escapeHtml(adventure.world.name)}</h2><p>${escapeHtml(adventure.targetOutcome)}</p></div><div class="library-progress"><span><i style="transform:scaleX(${progress.percent / 100})"></i></span><strong>${progress.percent}%</strong><small>${active && !active.completed ? `Next: ${escapeHtml(active.title)}` : "Trail complete"}</small></div></a><button class="icon-button" type="button" data-action="open-world-actions" data-id="${attr(adventure.id)}" aria-label="More actions for ${attr(adventure.title)}">•••</button></article>`;
}

function renderSettings() {
  return shell(`<div class="page page--settings"><section class="settings-hero reveal"><div><p class="eyebrow"><span></span>Settings</p><h1>Your trail, your <em>control.</em></h1><p>Manage identity, motion, backups, and stored learning data. No provider key is required or accepted.</p></div><div class="storage-seal"><span>${icon(state.platform.storageMode === "anna" ? "spark" : "library")}</span><p><strong>${state.platform.storageMode === "anna" ? "Anna Storage" : "This device"}</strong><small>${state.platform.storageMode === "anna" ? "Synced for this Anna account" : "Preview data remains in this browser"}</small></p></div></section>
    <section class="settings-layout reveal"><div class="settings-main"><form id="profile-form" class="settings-group"><header><p class="eyebrow">Profile</p><h2>How the Mentor addresses you.</h2></header><label class="field"><span>Display name <i>Optional</i></span><input name="name" maxlength="80" value="${attr(state.store.profile.name)}" placeholder="Your name"></label><button class="button button--bone" type="submit">Save profile</button></form><div class="settings-group"><header><p class="eyebrow">Experience</p><h2>Motion and contrast.</h2></header><label class="toggle-row"><div><strong>Reduce motion</strong><p>Remove transitions, celebration movement, and animated reveals.</p></div><input type="checkbox" data-preference="reduceMotion" ${state.store.preferences.reduceMotion ? "checked" : ""}><span></span></label><label class="toggle-row"><div><strong>High contrast</strong><p>Increase text and control contrast while keeping the same palette.</p></div><input type="checkbox" data-preference="highContrast" ${state.store.preferences.highContrast ? "checked" : ""}><span></span></label></div></div>
      <aside class="settings-side"><div class="settings-group"><header><p class="eyebrow">Portable backup</p><h2>Keep a copy of every world.</h2></header><p>Exports contain goals, generated plans, mission evidence, reflections, chat, and progress.</p><button class="button button--ghost" type="button" data-action="export-all">${icon("download")} Export JSON backup</button><input id="import-file" type="file" accept="application/json,.json" hidden><button class="button button--ghost" type="button" data-action="choose-import">${icon("upload")} Restore from backup</button></div><div class="danger-zone"><p class="eyebrow">Danger zone</p><h2>Clear SkillQuest data.</h2><p>This removes every adventure and preference from the current Anna account or preview device.</p><button class="quiet-danger" type="button" data-action="confirm-clear-all">Clear all data</button></div></aside></section>
  </div>`);
}

function renderNotFound(message = "This trail could not be found.") {
  return shell(`<div class="page message-page"><section class="message-panel reveal"><span>${icon("compass")}</span><p class="eyebrow">Lost trail</p><h1>${escapeHtml(message)}</h1><p>Return to your saved worlds and choose an available adventure.</p>${button("Open world library", "#/library")}</section></div>`);
}

function render() {
  document.documentElement.dataset.reduceMotion = String(state.store.preferences.reduceMotion);
  document.documentElement.dataset.highContrast = String(state.store.preferences.highContrast);
  if (!state.ready) {
    app.innerHTML = `<div class="boot-screen"><img src="./logo.svg" alt=""><span>Preparing your map</span></div>`;
    return;
  }
  const current = route();
  let html;
  if (current.name === "home") html = renderHome();
  else if (current.name === "new") html = renderNewAdventure();
  else if (current.name === "library") html = renderLibrary();
  else if (current.name === "settings") html = renderSettings();
  else if (current.name === "adventure") {
    const adventure = adventureById(current.adventureId);
    if (!adventure) html = renderNotFound();
    else if (current.section === "map" || !current.section) html = renderQuestMap(adventure);
    else if (current.section === "mission") html = renderMission(adventure, current.itemId);
    else if (current.section === "mentor") html = renderMentor(adventure);
    else if (current.section === "skills") html = renderSkills(adventure);
    else if (current.section === "journal") html = renderJournal(adventure);
    else html = renderNotFound();
  } else html = renderNotFound();
  app.innerHTML = html;
  activateReveals();
  resizeMentorInput();
}

function activateReveals() {
  const elements = [...document.querySelectorAll(".reveal")];
  if (!elements.length) return;
  if (state.store.preferences.reduceMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -24px" });
  elements.forEach((element) => observer.observe(element));
}

function collectWizardStep() {
  const form = document.getElementById("adventure-form");
  if (!form) return false;
  const data = new FormData(form);
  for (const [key, value] of data.entries()) {
    if (["minutesPerSession", "sessionsPerWeek", "durationWeeks"].includes(key)) state.creationDraft[key] = Number(value);
    else state.creationDraft[key] = String(value);
  }
  if (cleanText(state.creationDraft.goal, 800).length < 12) {
    toast("Describe what you want to learn in a little more detail.", "error");
    form.querySelector('[name="goal"]')?.focus();
    return false;
  }
  return true;
}

async function createAdventureFlow() {
  if (state.creating || !collectWizardStep()) return;
  if (state.store.adventures.length >= MAX_ADVENTURES) {
    toast(`SkillQuest keeps up to ${MAX_ADVENTURES} adventures. Export or remove one before creating another.`, "error", 7000);
    return;
  }
  state.creating = true;
  showBusy("Building your practice path", state.creationDraft.sourceMaterial ? "Anna is reading your goal and the material you chose to share." : "Anna is turning your goal into short, ordered practice tasks.");
  const input = normalizeAdventureInput(state.creationDraft);
  let plan;
  let source = "anna";
  try {
    plan = await state.platform.generatePlan(input);
  } catch {
    plan = buildFallbackPlan(input);
    source = "local";
  }
  const adventure = createAdventure(input, plan, source);
  state.store.adventures.unshift(adventure);
  state.store.activeAdventureId = adventure.id;
  await saveNow();
  state.creating = false;
  hideModal();
  state.creationDraft = { goal: "", skill: "", title: "", targetOutcome: "", motivation: "", sourceMaterial: "", sourceLabel: "", currentLevel: "beginner", pace: "steady", minutesPerSession: 30, sessionsPerWeek: 4, durationWeeks: 6, preferredPractice: "" };
  location.hash = `/adventure/${adventure.id}/map`;
  toast(source === "anna" ? "Anna created a twelve-task practice path around your goal." : "Anna was unavailable, so a transparent local practice path keeps you moving.", source === "anna" ? "success" : "default", 7000);
}

async function submitMission(form) {
  const current = route();
  const adventure = adventureById(current.adventureId);
  const quest = flattenQuests(adventure).find((item) => item.id === current.itemId);
  if (!adventure || !quest || state.evaluatingQuestId) return;
  const draft = draftForQuest(quest);
  const proof = cleanText(draft.proof, 6000);
  const workMaterial = cleanText(draft.workMaterial, 5000);
  const reflection = cleanText(draft.reflection, 3000);
  if (proof.length < 20 && workMaterial.length < 20) {
    toast("Paste or import real work, or describe concrete evidence before submitting.", "error", 6000);
    form.querySelector('[name="workMaterial"]')?.focus();
    return;
  }
  const submission = { workMaterial, proof, reflection, checks: draft.checks };
  state.evaluatingQuestId = quest.id;
  showBusy(quest.type === "boss" ? "Reviewing the milestone" : "Reviewing your work", "Anna is comparing only your submitted material and evidence with the saved success criteria.");
  let evaluation;
  try {
    evaluation = await state.platform.evaluateMission(adventure, quest, submission);
  } catch {
    evaluation = buildFallbackEvaluation(quest, submission);
  }
  const updated = completeQuest(adventure, quest.id, submission, evaluation);
  replaceAdventure(updated);
  delete state.missionDrafts[quest.id];
  await saveNow();
  state.evaluatingQuestId = null;
  hideModal();
  render();
  showCompletion(updated, quest, evaluation);
}

async function sendMentor(adventure, question) {
  const cleanQuestion = cleanText(question, 1200);
  if (!cleanQuestion || state.mentorBusy) return;
  const quest = getActiveQuest(adventure);
  const userMessage = { id: createId("message"), role: "user", source: "user", text: cleanQuestion, createdAt: new Date().toISOString() };
  adventure.chat.push(userMessage);
  adventure.chat = adventure.chat.slice(-40);
  state.mentorDraft = "";
  state.mentorBusy = true;
  replaceAdventure(adventure);
  render();
  requestAnimationFrame(() => document.getElementById("mentor-log")?.lastElementChild?.scrollIntoView({ block: "end", behavior: state.store.preferences.reduceMotion ? "auto" : "smooth" }));
  let reply;
  let source = "anna";
  try {
    reply = await state.platform.mentorReply(adventure, quest, cleanQuestion);
  } catch {
    reply = buildFallbackMentorReply(adventure, quest, cleanQuestion);
    source = "local";
  }
  adventure.chat.push({ id: createId("message"), role: "assistant", source, text: reply, createdAt: new Date().toISOString() });
  adventure.chat = adventure.chat.slice(-40);
  adventure.updatedAt = new Date().toISOString();
  replaceAdventure(adventure);
  await saveNow();
  state.mentorBusy = false;
  render();
  requestAnimationFrame(() => {
    document.getElementById("mentor-log")?.lastElementChild?.scrollIntoView({ block: "end", behavior: "auto" });
    document.getElementById("mentor-input")?.focus();
  });
  if (source === "local") toast("Anna was unavailable, so the Mentor used a transparent mission-grounded fallback.", "default", 6500);
}

function resizeMentorInput() {
  const input = document.getElementById("mentor-input");
  if (!input) return;
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
}

function showBusy(title, detail) {
  modalRoot.hidden = false;
  modalRoot.innerHTML = `<div class="modal-backdrop modal-backdrop--solid"></div><section class="busy-modal" role="dialog" aria-modal="true" aria-labelledby="busy-title"><div class="busy-sigil">${icon("spark")}<i></i><i></i></div><p class="eyebrow">SkillQuest AI</p><h2 id="busy-title">${escapeHtml(title)}</h2><p>${escapeHtml(detail)}</p><div class="busy-track"><i></i></div><small>Keep this window open. No progress is awarded until the result is saved.</small></section>`;
}

function showCompletion(adventure, quest, evaluation) {
  const next = getActiveQuest(adventure);
  modalRoot.hidden = false;
  modalRoot.innerHTML = `<div class="modal-backdrop" data-action="close-modal"></div><section class="completion-modal" role="dialog" aria-modal="true" aria-labelledby="completion-title"><div class="completion-burst" aria-hidden="true"><i></i><i></i><i></i><i></i></div><button class="icon-button completion-close" type="button" data-action="close-modal" aria-label="Close">${icon("close")}</button><span class="completion-emblem">${icon(quest.type === "boss" ? "crown" : "flag")}</span><p class="eyebrow">${quest.type === "boss" ? "Boss cleared" : "Mission cleared"}</p><h2 id="completion-title">${escapeHtml(quest.title)}</h2><p>${escapeHtml(evaluation.verdict)}</p><div class="reward-row"><span><strong>+${quest.xp}</strong><small>XP</small></span><span><strong>${evaluation.score}</strong><small>review score</small></span><span><strong>${adventure.stats.streak}</strong><small>day streak</small></span></div><div class="completion-actions"><button class="button button--ghost" type="button" data-action="close-modal">Review feedback</button>${next && !next.completed ? button("Open next quest", `#/adventure/${adventure.id}/mission/${next.id}`) : button("Return to the map", `#/adventure/${adventure.id}/map`)}</div></section>`;
}

function showWorldActions(adventure) {
  modalRoot.hidden = false;
  modalRoot.innerHTML = `<div class="modal-backdrop" data-action="close-modal"></div><section class="action-sheet" role="dialog" aria-modal="true" aria-labelledby="world-actions-title"><header><div><p class="eyebrow">World actions</p><h2 id="world-actions-title">${escapeHtml(adventure.world.name)}</h2></div><button class="icon-button" type="button" data-action="close-modal" aria-label="Close">${icon("close")}</button></header><div class="action-list"><a href="#/adventure/${adventure.id}/journal">${icon("journal")}<span><strong>Open field journal</strong><small>Review evidence and reflections.</small></span></a><button type="button" data-action="duplicate-adventure" data-id="${attr(adventure.id)}">${icon("copy")}<span><strong>Duplicate fresh adventure</strong><small>Keep the structure and reset all progress.</small></span></button><button type="button" data-action="export-adventure" data-id="${attr(adventure.id)}">${icon("download")}<span><strong>Export this world</strong><small>Download a portable JSON copy.</small></span></button><button class="danger-action" type="button" data-action="confirm-delete-adventure" data-id="${attr(adventure.id)}">${icon("trash")}<span><strong>Delete this world</strong><small>This removes its map, evidence, chat, and journal.</small></span></button></div></section>`;
}

function showJournalModal(adventure) {
  modalRoot.hidden = false;
  modalRoot.innerHTML = `<div class="modal-backdrop" data-action="close-modal"></div><section class="form-modal" role="dialog" aria-modal="true" aria-labelledby="journal-note-title"><header><div><p class="eyebrow">Field note</p><h2 id="journal-note-title">Keep what practice revealed.</h2></div><button class="icon-button" type="button" data-action="close-modal" aria-label="Close">${icon("close")}</button></header><form id="journal-form"><label class="field"><span>Note title</span><input name="title" maxlength="120" required placeholder="A useful observation"></label><label class="field"><span>What should future-you remember?</span><textarea name="body" maxlength="4000" rows="7" required placeholder="Record the pattern, mistake, breakthrough, or question…"></textarea></label><button class="button button--lime button--nested" type="submit"><span>Save field note</span><i>${icon("check")}</i></button></form></section>`;
}

function confirmModal(title, detail, action, id = "") {
  modalRoot.hidden = false;
  modalRoot.innerHTML = `<div class="modal-backdrop" data-action="close-modal"></div><section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><span>${icon("trash")}</span><p class="eyebrow">Permanent action</p><h2 id="confirm-title">${escapeHtml(title)}</h2><p>${escapeHtml(detail)}</p><div><button class="button button--ghost" type="button" data-action="close-modal">Cancel</button><button class="button button--danger" type="button" data-action="${action}" data-id="${attr(id)}">Delete permanently</button></div></section>`;
}

function hideModal() {
  modalRoot.hidden = true;
  modalRoot.innerHTML = "";
}

function toast(message, kind = "default", duration = 4200) {
  const item = document.createElement("div");
  item.className = `toast toast--${kind}`;
  item.innerHTML = `<span>${icon(kind === "success" ? "check" : kind === "error" ? "flag" : "spark")}</span><p>${escapeHtml(message)}</p><button type="button" aria-label="Dismiss">${icon("close")}</button>`;
  item.querySelector("button").addEventListener("click", () => item.remove());
  toastRoot.append(item);
  setTimeout(() => item.classList.add("is-visible"), 20);
  setTimeout(() => { item.classList.remove("is-visible"); setTimeout(() => item.remove(), 450); }, duration);
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function readSharedTextFile(file, maxCharacters = 5000) {
  const allowed = /\.(?:txt|md|js|jsx|ts|tsx|py|html|css|json|csv|ya?ml)$/i;
  if (!allowed.test(file?.name || "")) throw new Error("Choose a plain-text, code, Markdown, JSON, CSV, or YAML file.");
  if (file.size > 1_000_000) throw new Error("Choose a text file smaller than 1 MB.");
  const content = cleanText(await file.text(), maxCharacters);
  if (content.length < 20) throw new Error("That file does not contain enough readable text.");
  return content;
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "choose-learning-source") {
    document.getElementById("learning-source-file")?.click();
  } else if (action === "choose-mission-source") {
    document.getElementById("mission-source-file")?.click();
  } else if (action === "activate-adventure") {
    state.store.activeAdventureId = target.dataset.id;
    queueSave();
  } else if (action === "mentor-starter") {
    state.mentorDraft = target.dataset.question || "";
    const input = document.getElementById("mentor-input");
    if (input) { input.value = state.mentorDraft; resizeMentorInput(); input.focus(); }
    document.getElementById("mentor-count").textContent = `${state.mentorDraft.length}/1200`;
  } else if (action === "clear-mentor") {
    const current = route();
    const adventure = adventureById(current.adventureId);
    adventure.chat = [];
    adventure.updatedAt = new Date().toISOString();
    replaceAdventure(adventure);
    await saveNow();
    render();
    toast("Mentor conversation cleared.", "success");
  } else if (action === "open-world-actions") {
    showWorldActions(adventureById(target.dataset.id));
  } else if (action === "duplicate-adventure") {
    const source = adventureById(target.dataset.id);
    if (state.store.adventures.length >= MAX_ADVENTURES) return toast(`SkillQuest keeps up to ${MAX_ADVENTURES} worlds.`, "error");
    const copy = duplicateAdventure(source);
    state.store.adventures.unshift(copy);
    state.store.activeAdventureId = copy.id;
    await saveNow();
    hideModal();
    location.hash = `/adventure/${copy.id}/map`;
    toast("Fresh adventure created with all progress reset.", "success");
  } else if (action === "export-adventure") {
    const adventure = adventureById(target.dataset.id);
    downloadJson(`skillquest-${adventure.skill.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "adventure"}.json`, { version: 1, adventure });
    hideModal();
  } else if (action === "confirm-delete-adventure") {
    const adventure = adventureById(target.dataset.id);
    confirmModal(`Delete ${adventure.world.name}?`, "Its map, evidence, XP, chat, and journal cannot be recovered unless you exported a backup.", "delete-adventure", adventure.id);
  } else if (action === "delete-adventure") {
    state.store.adventures = state.store.adventures.filter((item) => item.id !== target.dataset.id);
    state.store.activeAdventureId = state.store.adventures[0]?.id || null;
    await saveNow();
    hideModal();
    location.hash = "/library";
    render();
    toast("Adventure permanently deleted.", "success");
  } else if (action === "open-journal-note") {
    showJournalModal(activeAdventure());
  } else if (action === "export-all") {
    downloadJson(`skillquest-backup-${new Date().toISOString().slice(0, 10)}.json`, state.store);
    toast("Backup downloaded.", "success");
  } else if (action === "choose-import") {
    document.getElementById("import-file")?.click();
  } else if (action === "confirm-clear-all") {
    confirmModal("Clear every SkillQuest world?", "All adventures, XP, evidence, journal entries, chat, and preferences will be permanently removed.", "clear-all");
  } else if (action === "clear-all") {
    await state.platform.clear();
    state.store = defaultStore();
    state.missionDrafts = {};
    hideModal();
    location.hash = "/home";
    render();
    toast("All SkillQuest data has been cleared.", "success");
  } else if (action === "close-modal") {
    hideModal();
  }
});

document.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (event.target.id === "adventure-form") await createAdventureFlow();
  else if (event.target.id === "mission-form") await submitMission(event.target);
  else if (event.target.id === "mentor-form") {
    const adventure = adventureById(route().adventureId);
    await sendMentor(adventure, new FormData(event.target).get("question"));
  } else if (event.target.id === "journal-form") {
    const adventure = adventureById(route().adventureId) || activeAdventure();
    const data = new FormData(event.target);
    try {
      const updated = addJournalEntry(adventure, { title: data.get("title"), body: data.get("body") });
      replaceAdventure(updated);
      await saveNow();
      hideModal();
      render();
      toast("Field note saved.", "success");
    } catch (error) {
      toast(error.message, "error");
    }
  } else if (event.target.id === "profile-form") {
    state.store.profile.name = cleanText(new FormData(event.target).get("name"), 80);
    await saveNow();
    render();
    toast("Profile saved.", "success");
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.closest("#adventure-form") && target.name) {
    state.creationDraft[target.name] = ["minutesPerSession", "sessionsPerWeek", "durationWeeks"].includes(target.name) ? Number(target.value) : target.value;
  } else if (target.matches("[data-mission-field]")) {
    const current = route();
    const adventure = adventureById(current.adventureId);
    const quest = flattenQuests(adventure).find((item) => item.id === current.itemId);
    draftForQuest(quest)[target.dataset.missionField] = target.value;
  } else if (target.matches("[data-mission-check]")) {
    const current = route();
    const adventure = adventureById(current.adventureId);
    const quest = flattenQuests(adventure).find((item) => item.id === current.itemId);
    draftForQuest(quest).checks[Number(target.dataset.missionCheck)] = target.checked;
  } else if (target.id === "mentor-input") {
    state.mentorDraft = target.value;
    document.getElementById("mentor-count").textContent = `${target.value.length}/1200`;
    resizeMentorInput();
  } else if (target.matches("[data-library-search]")) {
    state.libraryQuery = target.value;
    render();
    document.querySelector("[data-library-search]")?.focus();
  } else if (target.matches("[data-journal-search]")) {
    state.journalQuery = target.value;
    render();
    document.querySelector("[data-journal-search]")?.focus();
  }
});

document.addEventListener("change", async (event) => {
  const target = event.target;
  if (target.matches("[data-preference]")) {
    state.store.preferences[target.dataset.preference] = target.checked;
    await saveNow();
    render();
  } else if (target.id === "import-file" && target.files?.[0]) {
    try {
      const raw = JSON.parse(await target.files[0].text());
      const imported = normalizeStore(raw);
      if (!imported.adventures.length && raw?.adventures?.length) throw new Error("The backup did not contain readable adventures.");
      state.store = imported;
      await saveNow();
      render();
      toast(`Restored ${imported.adventures.length} ${imported.adventures.length === 1 ? "world" : "worlds"}.`, "success");
    } catch (error) {
      toast(`That backup could not be restored: ${error.message}`, "error", 7000);
    } finally {
      target.value = "";
    }
  } else if (target.id === "learning-source-file" && target.files?.[0]) {
    try {
      state.creationDraft.sourceMaterial = await readSharedTextFile(target.files[0]);
      state.creationDraft.sourceLabel = cleanText(target.files[0].name, 120);
      render();
      toast(`Added ${state.creationDraft.sourceLabel} as grounding material.`, "success");
    } catch (error) {
      toast(error.message, "error", 7000);
    } finally {
      target.value = "";
    }
  } else if (target.id === "mission-source-file" && target.files?.[0]) {
    try {
      const current = route();
      const adventure = adventureById(current.adventureId);
      const quest = flattenQuests(adventure).find((item) => item.id === current.itemId);
      const draft = draftForQuest(quest);
      draft.workMaterial = await readSharedTextFile(target.files[0]);
      draft.materialLabel = cleanText(target.files[0].name, 120);
      render();
      toast(`Added ${draft.materialLabel} for Anna to review.`, "success");
    } catch (error) {
      toast(error.message, "error", 7000);
    } finally {
      target.value = "";
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalRoot.hidden && !state.creating && !state.evaluatingQuestId) hideModal();
  if (event.target.id === "mentor-input" && event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    if (!state.mentorBusy) event.target.form?.requestSubmit();
  }
});

window.addEventListener("hashchange", () => {
  render();
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.getElementById("workspace")?.focus({ preventScroll: true });
});

async function boot() {
  render();
  await state.platform.connect();
  state.store = await state.platform.load();
  state.ready = true;
  if (!location.hash) location.hash = "/home";
  render();
  if (state.platform.storageWarning) toast("Anna Storage was unavailable, so preview data is staying on this device.", "default", 7000);
}

boot().catch((error) => {
  state.ready = true;
  state.store = defaultStore();
  render();
  toast(`SkillQuest started in recovery mode: ${error.message}`, "error", 8000);
});
