# Changelog

## 0.4.0 — Skills-first source release (npm pending)

- Seven agent-native closed-loop skills with common durable handoffs and bounded repair.
- Six host directory adapters plus generic/custom skill locations.
- Self-contained checkpoint helper with evidence hashes, stale-stage invalidation and locks.
- Legacy runner retained only for compatibility.

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
