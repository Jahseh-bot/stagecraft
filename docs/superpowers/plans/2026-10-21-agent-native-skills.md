# Agent-native Stagecraft Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make each of seven independent stages executable inside the user's current coding agent, with bounded autonomous repair and durable, compatible handoffs.

**Architecture:** Preserve `packages/<stage>/skills/stagecraft-<stage>/` as public skill roots. Distribute the same portable protocol, report template and optional Node handoff helper within each standalone package. The current agent performs the work; no nested Codex process, runner gate or answers.json is required. Keep the legacy runner available for existing run recovery, but document Skills as the default.

**Tech Stack:** Agent Skills Markdown, Node.js built-ins for deterministic checkpoints and installation, node:test, VitePress documentation.

## 1. Delivery contract and independent stage workflows

Files: `tooling/skill-shared/protocol.md`, `tooling/skill-shared/handoff.mjs`, `packages/*/skills/stagecraft-*/SKILL.md`, each `assets/report.md`.

- [x] Snapshot existing seven skills under ignored `output/skill-evals/baseline/` for comparison.
- [x] Define one workflow directory `.stagecraft/workflows/<id>` with `workflow.json`; keep legacy `.stagecraft/runs/` untouched. Record schema, project, objective, entry, until, decisions, stages, artifacts, evidence and remaining blockers. Helper statuses: pending, in_progress, completed, blocked, stale; reports additionally describe partial/failed outcomes.
- [x] Implement `init --project PATH --entry STAGE --until STAGE --goal TEXT`, `status --workflow PATH`, `begin --workflow PATH --stage STAGE`, `complete --workflow PATH --stage STAGE --receipt PATH`, and `block --workflow PATH --stage STAGE --reason TEXT`. Receipts contain summary, artifacts, evidence and next action. Bind to project paths, validate files and hashes, serialize writes, reject completion without evidence, and invalidate downstream stages after changed inputs.
- [x] Copy shared files through `tooling/build.mjs`; each package remains installable without siblings. Provide a Markdown-only equivalent when host cannot run Node. Never claim that a receipt alone proves tests executed: receipt records point to actual logs.
- [x] Rewrite each stage with entry recovery, concrete outputs, acceptance checks, repair/escalation rules and handoff. Reuse known facts; ask only consequential unresolved questions. Default to up to three targeted attempts with new evidence, stop repeated identical failures and report blocker honestly. Honor audit-only requests. Advance only to the user's delivery target.

## 2. Portable installation

Files: `tooling/installer.mjs`, `tooling/stage-cli.mjs`, `tests/packages.test.mjs`, `docs/agent-compatibility.md`.

- [x] Retain existing Codex/Claude paths; add officially documented Cursor, Copilot, Gemini and OpenCode paths, plus generic `.agents/skills` and an explicit `--skills-dir` destination for other hosts. No edits to user agent instruction files.
- [x] Preserve dry-run, repeatability, symlink rejection and conflict protection. Document existing different-content refusal rather than silently replacing customized skills.
- [x] Check all installations from isolated npm tarballs; verify bundled relative references and helper behavior independently of repository paths.

## 3. Primary onboarding and migration

Files: `README.md`, `CONTEXT.md`, `docs/npm-usage.md`, `docs/architecture.md`, `tooling/docs.mjs`, `website/docs/guide/*`, `website/docs/cli/index.md`, `website/docs/workflow/index.md`, `website/docs/.vitepress/theme/HomePage.vue`.

- [x] Present installation then in-agent invocation examples for every stage. Explain direct entry with no upstream artifacts and authorized multi-stage continuation.
- [x] Move prior runner walkthrough to legacy documentation; retain runnable recovery examples. Describe the interrupted 0.3.1 publication accurately; select 0.4.0 for the Skills-first release rather than overwrite an npm version.
- [x] Update website source snapshots and content checks to the new onboarding contract. Keep source/website content synchronized.

## 4. Validation and delivery

Files: `tests/skill-handoff.test.mjs`, `tests/skills-contract.test.mjs`, `evals/skills.json`, ignored `output/skill-evals/iteration-1/`.

- [x] Verify direct entry, authorized progression, pending blockers, missing evidence, traversal/symlink protection, stale upstream invalidation, concurrent writer rejection and no overwrite of legacy state.
- [x] Run real agent evaluations against new and baseline skills: independent build/fix, read-only audit, build-to-test handoff. Save observed artifacts, assertions and a review viewer; distinguish installed-format checks from live host execution.
- [x] Run `npm test`, `npm run release`, `npm run release:publish -- --dry-run`, and `SITE_BASE=/stagecraft/ npm --prefix website run build` plus website content/output checks.
- [x] Commit and push coherent refactor. Publish only fully tested artifacts; if npm requires user verification, retain exact artifacts and provide concrete verification handoff. Verify registry availability before claiming release complete.

Delivery note: npm 0.4.0 publication is deferred; eight tarballs and publish dry-run passed. No registry release is claimed. See docs/skills-validation.md for scope and limitations.
