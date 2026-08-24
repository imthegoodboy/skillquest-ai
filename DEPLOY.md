# SkillQuest AI deployment

Controlling guide: https://forum.anna.partners/t/build-on-anna-101/228

## Identity

```text
name: SkillQuest AI
slug: skillquest-ai
version: 1.0.0
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

The live test must create a plan labelled `Anna`, receive a non-fallback Mentor
reply, evaluate a mission, and finish without application console errors.

Verified on 2026-08-24 with Anna CLI `0.1.49` and schema `0.19.0`:

```text
13 deterministic logic/platform tests passed
5 desktop Anna-harness workflows passed
axe accessibility scans passed
1 real 390x780 manifest workflow passed without horizontal overflow
1 live Anna plan + evaluation + Mentor workflow passed in 1.9 minutes
strict validation passed
0 npm vulnerabilities
```

The current live provider can spend a full `4098`-token cap without visible
content on a large structured plan. Production therefore asks Anna for a compact
world outline and deterministically expands it into the complete mission
contract. Empty content is rejected, one retry is bounded, and local recovery is
always labelled.

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
