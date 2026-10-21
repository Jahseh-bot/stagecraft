# npm Publishing Implementation Plan

> Execute inline under the user's authorization; do not publish into an unconfirmed namespace.

**Goal:** Public registry installation and npx entrypoints for PRD, test and deploy.
**Architecture:** Preserve independent packages. Use one fixed version and configurable owner scope; publish tested tarballs, compare registry integrity on retries, verify registry consumers.
**Tech Stack:** Node ESM, npm workspaces, npm publish/exec.

- [x] Add scope configuration and synchronized SemVer version command; keep the workspace private.
- [x] Add public metadata, MIT license and third-party notices to packaged files.
- [x] Make install tests independent of the draft scope and version.
- [x] Add publishing script with explicit dry-run, artifact hash checks and registry collision checks.
- [x] Document npx commands, approvals, prerequisites, release/retry and first-publish authentication.
- [x] Run regression and dry-run package validation.
- [x] Completed account 2FA, published all eight @gaaraa/* packages at 0.3.0, and verified integrity plus actual npx skill installation/routing from a fresh external consumer. Initial E403 resolved by user account setup and interactive browser authorization.
