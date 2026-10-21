# Installable Stagecraft Packages Implementation Plan

> **For agentic workers:** Execute inline in this session; user has authorized implementation and external acceptance.

**Goal:** Versioned npm tarballs run outside the source repository from PRD through repair and local deployment.

**Architecture:** Keep the runner self-contained. Build/test/deploy stage packages embed the same runtime at build time and dispatch their own `run` entry without sibling dependencies. Source workspace stays private; distribution uses installable tarballs without claiming public registry availability.

**Tech Stack:** Node.js >=22 ESM, npm pack/install, authenticated Codex CLI, local Docker Compose.

### Task 1 Package runtime boundary

- [x] Update eight package versions to 0.2.0 and add runner --version.
- [x] Generate stage entry wrappers: init keeps installer behavior; build/test/deploy run dispatches to embedded start/test/deploy; answer/status/resume/skills remain available.
- [x] Copy runner bin/src/vendor/profile/package metadata into each executable stage package runtime. No lifecycle script may require source checkout after installation.
- [x] Test install stage tarballs independently in temporary consumers and snapshot skills using installed files.

### Task 2 Release artifacts

- [x] Add tooling/release.mjs: build, npm pack every workspace package into a chosen output directory, write integrity/file manifest, never publish.
- [x] Add npm run release and install/run documentation using actual tarball filenames and executable names.
- [x] Run npm test and npm run release; confirm package payload excludes source output, credentials and node_modules.

### Task 3 Outside-repository acceptance

- [x] Create /Users/curveslink/stagecraft-acceptance/2026-10-21 with copied tarballs, separate runner/test/deploy consumers and an empty app directory.
- [x] Install with npm install --ignore-scripts --no-audit --no-fund, invoke only installed bin files, record resolved runtime paths.
- [x] Supply a new PRD for a Node parcel quotation application on smoke port 43201 and deployed port 43202, Compose project stagecraft-package-acceptance.
- [x] Review and answer consequential questions and plan; run automatic development, real checks and generated Docker/Compose deployment.
- [x] Use real discovered input-type and frontend decimal-conversion defects with the independently installed test package; preserve original tests and confirm red→repair→green twice (no artificial fault injection).
- [x] Use the independently installed deploy package to update deployment, verify HTTP calculations and all containers healthy, preserve evidence and reviewable delivery instructions.
- [x] Prove runtime independence by making the source checkout unreadable during installed commands, record denied reads and resolved installation paths, restore permissions, and document external prerequisites honestly.
