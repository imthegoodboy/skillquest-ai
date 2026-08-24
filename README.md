# SkillQuest AI

SkillQuest AI turns a real learning goal into a personalized progression world
inside Anna. Anna creates the world identity, abilities, and stage focus; the
tested progression engine expands that outline into a practical 12-quest map,
milestone boss battles, evidence criteria, timing, and XP. The learner—not the
model—submits the work and owns every completion.

Core capabilities:

- personalized multi-stage adventures generated from goal, level, schedule, and outcome;
- sequential quest map with missions, boss battles, XP, levels, streaks, and badges;
- field guides, action steps, completion criteria, proof, reflection, and evaluation;
- active-quest Mentor chat grounded in the saved adventure;
- skill-tree progression and a searchable learning journal;
- multiple adventures, duplication, JSON backup/restore, and deletion controls;
- Anna Storage sync and transparent deterministic fallbacks when LLM output is unavailable.

No Executa or external API key is required. See `DEPLOY.md` for release gates.

The app treats empty, truncated, or malformed model output as a recoverable
condition. One bounded retry is allowed, then a clearly labelled local map,
mission review, or Mentor reply preserves the workflow without pretending the
fallback came from Anna.

```powershell
npm install
npm run verify
npm run test:e2e:live
```
