# Existing Project Entries Implementation Plan

**Goal:** Existing projects enter testing or local Compose deployment without PRD or product clarification.

**Architecture:** Reuse persisted runs and human decisions. Test plans inspect existing tests read-only, freeze them on approval and execute verification directly. Deployment uses an explicit local Compose target, read-only inspection, approved preflight checks, persisted mutation intent, health reconciliation and a surviving service. Upstream design/testing/deployment methods are pinned and snapshotted per run.

**Tech Stack:** Node ESM, Codex CLI, Docker Compose, node:test.

## Tasks
- [x] Extend contracts/store/CLI with `test --dir`, `deploy --dir --target`, entry-specific planning, optional smoke for tests and deploy, explicit audit/repair modes.
- [x] Extend engine transitions: test approval goes straight to verification, audit reports failed checks without fixing code; repair remains bounded. Deployment approval runs checks and local Compose up, then health observation. Interruption after deployment intent requires reconciliation, never blind replay.
- [x] Add deployment module for validated loopback target, explicit Docker context, immutable rendered Compose config snapshot, preflight, up, ps and health evidence. Keep successful deployment running and provide exact scoped cleanup argv.
- [x] Vendor Anthropic frontend-design/webapp-testing and community docker-expert with exact revisions and licenses; add phase bindings and preserve custom PRD profiles.
- [x] Regression tests: old PRD flow, direct testing without smoke, failing audit and bounded repairs, invalid target, deployment failure/reconciliation, frozen deployment config.
- [x] Live exercises: existing converter with deliberate regression through real Codex test planning/repair, real local Compose deployment and HTTP checks, report evidence and limits.

Execute in this session as already authorized. No repository is initialized here, so no commits are created.
