# Changelog

## 0.3.0 — release candidate, not yet published

- Public package metadata, MIT license and preserved upstream license notices.
- Self-contained npx PRD/build, test and local Compose deployment entrypoints.
- Synchronized versions and configurable owner scope.
- Publish the exact packed artifacts; verify hashes, reject version collisions, resume partial publication only for identical bytes.
- Registry-based external npx verification and generated scope/version-specific usage documentation.

## 0.2.0 — local tarball distribution

- Eight independently installable packages; executable build/test/deploy packages embed the runtime.
- External PRD-to-deployment drill, two automatic repair cycles, 30 application tests and 46 package regression tests passed.
