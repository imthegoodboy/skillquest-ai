# SkillQuest AI

SkillQuest AI turns one open-ended learning goal into a personalized practice
path inside Anna. The learner can optionally paste or import a bounded text or
code excerpt, then Anna creates specific tasks from that real context. The
learner—not the model—submits the work and owns every completion.

Core capabilities:

- one-field, AI-first onboarding with optional time and experience controls;
- optional grounding in pasted text or imported plain-text/code files;
- a sequential 12-task practice path with clear objectives and success checks;
- AI review grounded in the learner's submitted material and evidence;
- an active-task AI coach grounded in the saved goal, task, and real work;
- progress tracking, a searchable learning journal, and lightweight XP, levels, streaks, and badges;
- multiple adventures, duplication, JSON backup/restore, and deletion controls;
- Anna Storage sync and transparent deterministic fallbacks when LLM output is unavailable.

No Executa or external API key is required. See `DEPLOY.md` for release gates.

The app treats empty, truncated, or malformed model output as a recoverable
condition. One bounded retry is allowed, then a clearly labelled local path,
work review, or coach reply preserves the workflow without pretending the
fallback came from Anna.

```powershell
npm install
npm run verify
npm run test:e2e:live
```
