# SkillQuest AI deployment

Controlling guide: https://forum.anna.partners/t/build-on-anna-101/228

## Identity

```text
name: SkillQuest AI
slug: skillquest-ai
version: 1.1.1
architecture: static Anna UI + Anna LLM + Anna Storage; no Executa
```

## Verification gate

```powershell
$ANNA_HOST = "https://anna.partners"
cd C:\Users\parth\Desktop\anna-skillquest-ai

npm ci
npm run check
npm run test:e2e
npm run test:e2e:live
anna-app apps status skillquest-ai --account $ANNA_HOST --json
```

The live test must create a path labelled `Anna`, receive a non-fallback Coach
reply grounded in saved material, evaluate submitted work, and finish without
application console errors.

Verified on 2026-08-25 with Anna CLI `0.1.49` and schema `0.19.0`:

```text
15 deterministic logic/platform tests passed
5 desktop Anna-harness workflows passed
axe accessibility scans passed
1 real 390x780 manifest workflow passed without horizontal overflow
1 live Anna path + grounded work evaluation + Coach workflow passed in 2.1 minutes
strict validation passed
0 npm vulnerabilities
```

The current live provider can spend a full `4098`-token cap without visible
content on a large structured plan. Production therefore asks Anna for a compact
world outline and deterministically expands it into the complete mission
contract. Empty content is rejected, one retry is bounded, and local recovery is
always labelled.

## Marketplace review recovery (2026-08-25)

Version `1.1.0` addresses the review feedback by:

- stating the goal → practice path → real work → AI feedback loop before gamification;
- replacing the three-step questionnaire with one natural-language goal and optional controls;
- giving task pages one primary action, a consistent Practice path breadcrumb, and secondary XP treatment;
- letting learners paste or import bounded text/code material for plan generation and task review;
- grounding plan, review, and Coach prompts in that material while treating embedded instructions as untrusted data.

Version `1.1.1` completes the first-use polish before resubmission by:

- separating the Back link from the onboarding guidance label;
- collapsing optional learning material behind progressive disclosure;
- keeping the primary path-generation action visible in the default 1200×820 Anna view;
- adding a browser regression check for all three conditions;
- regenerating the desktop and mobile Marketplace screenshots from the verified build.

## Previous remote handoff (2026-08-24)

```text
GitHub: https://github.com/imthegoodboy/skillquest-ai
Anna app id: 220
immutable version: 1.0.0 (#569)
bundle: bundle_ready, 6 files, 251.3 KB
owner install: 1.0.0
review candidate: 1.0.0 (superseded by the current handoff below)
status: pending_review
is_published: false
```

## Current remote handoff (2026-08-25)

```text
GitHub commit: 572b78e
Anna app id: 220
immutable version: 1.1.0 (#576)
content hash: 32371a1055267b36bfacde7480ad06d8ace11b679311ed790d8f761eacbc0d21
bundle: bundle_ready, 6 files, 270,271 bytes
listing: updated description, logo, and 4 CDN screenshots
installed version before acceptance: 1.0.0
review candidate before resubmission: 1.0.0
status: pending_review
is_published: false
```

Next gate: publish and install exact `1.1.1` from the SkillQuest Developer card, save its
permission configuration, exercise the installed first-use/material/review/Coach
flow, confirm `apps grants` reports `installed_version=1.1.1`, then resubmit and
confirm `review_candidate_version=1.1.1`. Do not click a Version-history
`Publish` button or run `apps release` before approval.

Do not release `1.0.0` or `1.1.0`. Verify, publish, install, and re-submit `1.1.1`, then
release only after Anna marks that exact candidate approved.

## Upload, install, and review

```powershell
anna-app apps publish --dry-run --account $ANNA_HOST --json
anna-app apps publish --account $ANNA_HOST --json
anna-app apps status skillquest-ai --account $ANNA_HOST --json
anna-app apps versions skillquest-ai --account $ANNA_HOST --json
anna-app apps sync-meta --account $ANNA_HOST --dry-run --json
anna-app apps sync-meta --account $ANNA_HOST --json
anna-app apps grants skillquest-ai --account $ANNA_HOST --json
anna-app apps submit-review skillquest-ai --account $ANNA_HOST --json
anna-app apps status skillquest-ai --account $ANNA_HOST --json
```

Install and test the exact uploaded version before review. Uploading, installing,
or entering `pending_review` does not make the app public. Release the immutable
version only after Anna marks that exact candidate approved.
