# Changelog

## 0.4.2 — Stage-by-stage conversation gates

- End each artifact delivery turn and wait for a later user review; revised artifacts require a fresh review.
- Route ideas and draft PRDs through their missing upstream stages instead of jumping to build.
- Update all seven entrypoints, shared protocols, report templates and website prompts; preserve third-party skills.
- Released in all eight npm packages at 0.4.2 and the GitHub skills catalog; npm 0.4.1 does not include this fix.

## 0.4.1 — Curated method orchestration and user-confirmed decisions (published 2026-10-21)

- Present concrete options and recommendation rationale for product scope, modules, flows, visual direction, core architecture and deployment; wait for user selection before dependent work.
- Reuse explicit choices and scoped delegation, then automatically implement, validate and hand off. Direct entry does not bypass decisions.
- All seven skills, report templates and beginner prompts share decision records and waiting/resumption rules.
- Stage-specific method recipes select bundled practices by task, with concrete outputs and evidence; direct build entry fills missing product/design work.
- Add pinned MIT grill-with-docs and domain-modeling with their complete dependency closure; preserve source licenses and adapt host-specific calls without omitting method outputs.

- Versioned artifact reviews, content snapshots and stale downstream checks in the v2 handoff helper.
- Built-in test-case design before test execution; expanded stage and cross-domain coverage.
- Reviewed frontend design, E2E and SQL method upgrades, source integrity auditing and recoverable maintenance commands in the source repository.
- All eight npm packages rebuilt from the current sources and published as 0.4.1; root release skills catalog included alongside tarballs.

## 0.4.0 — Skills-first npm release

- Seven agent-native closed-loop skills with common durable handoffs and bounded repair.
- Six host directory adapters plus generic/custom skill locations.
- Self-contained checkpoint helper with evidence hashes, stale-stage invalidation and locks.
- Legacy runner retained only for compatibility.
- Repository/release-root skills catalog supports `npx skills add Jahseh-bot/stagecraft`; generated from stage packages without changing published npm tarballs.

## 0.3.1 — partial publication, 2026-10-21

Only architect was published before the Skills-first direction replaced this release.

- Interactive terminal questions, explicit plan/setup approval, and retry/cancel menus.
- Resume pending 0.3.0 runs directly in the terminal; Ctrl+C/EOF preserves unanswered questions.
- Preserve JSON automation with --json and automatic non-TTY detection.

## 0.3.0 — 2026-10-21, public npm release

- Public package metadata, MIT license and preserved upstream license notices.
- Self-contained npx PRD/build, test and local Compose deployment entrypoints.
- Synchronized versions and configurable owner scope.
- Publish the exact packed artifacts; verify hashes, reject version collisions, resume partial publication only for identical bytes.
- Registry-based external npx verification and generated scope/version-specific usage documentation.

## 0.2.0 — local tarball distribution

- Eight independently installable packages; executable build/test/deploy packages embed the runtime.
- External PRD-to-deployment drill, two automatic repair cycles, 30 application tests and 46 package regression tests passed.
