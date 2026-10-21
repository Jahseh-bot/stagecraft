# Stagecraft agent-native protocol v1

## Execution owner and autonomy

The current coding agent executes the skill with its own file, command, browser and connector tools. Do not start another Codex/Claude/runner process, require a specific model, or make the user maintain answers.json. Do not spawn agents just because an upstream method suggests delegation. Use available tools and follow the user's project instructions and the host's permission rules.

Use the existing conversation, repository, supplied artifacts and prior handoffs before asking questions. Make reversible implementation choices yourself and record assumptions with their rationale. Ask only when the unresolved choice changes business meaning, creates material irreversible cost/data loss, needs credentials or expands authority. Batch necessary questions in ordinary conversation with a recommendation. Prior explicit authorization and accepted requirements remain valid; there is no compulsory approval ritual between stages. A request to implement a clear task authorizes routine local implementation, tests and fixes. It does not automatically authorize paid services, production data changes or unrelated publication.

A stage closes its own loop: inspect → choose acceptance conditions → produce work → actually validate → diagnose and repair → revalidate → persist evidence and handoff. Attempt up to three targeted repair cycles by default; use a different hypothesis supported by evidence on each attempt. Stop two consecutive identical failures without new evidence. Respect explicit time/repair limits. Do not weaken valid tests, hide failures or claim unexecuted commands passed. Document what failed and the smallest required user/environment action when blocked.

## Scope and direct entry

Stages: discover → spec → design → architect → build → test → deploy. The user can enter any stage with outside documents or an existing project. Missing upstream Stagecraft reports are not a blocker: inspect current inputs and create the minimum local acceptance brief needed for this stage. Do not fabricate upstream completion. Design can document “not applicable” with inspection evidence for non-UI work instead of inventing a UI.

Identify the delivery target from the user's actual request. For “test this module”, stop after tested findings/fixes within authorized scope. For “take this PRD through a working, tested app”, continue through build and test without asking permission at each transition. Deploy only to the specified, authorized target. If the next skill is installed, read it and continue in the same agent. Discover it in the host's skill catalog or sibling `stagecraft-<stage>/SKILL.md`; do not assume a particular slash-command syntax. If unavailable, hand over a complete report and the next skill name; do not claim that stage ran. No requirement to install seven skills for a one-stage task.

## Durable state and resumption

Use `.stagecraft/workflows/<id>/` under the target project; never rewrite legacy `.stagecraft/runs/*/state.json`. Reuse a workflow only when its project, objective and authorized target match. If several workflows plausibly match and conversation cannot disambiguate, ask one short selection question; do not pick the newest blindly. Read `workflow.json`, the current stage report and relevant artifact/evidence files before resuming. Retain decisions and acceptance IDs across hosts and sessions. Revalidate changed files, stale evidence and environment before skipping work. Do not repeat completed valid work.

When Node.js >=22 is available, use the bundled `scripts/handoff.mjs` as a checkpoint helper (resolve the path from THIS skill directory, not the project cwd). The agent runs these commands; the user does not need to type them:

```sh
node /path/to/skill/scripts/handoff.mjs init --project /absolute/project --entry build --until test --goal 'Implement and verify the specified feature'
node /path/to/skill/scripts/handoff.mjs begin --workflow /absolute/project/.stagecraft/workflows/ID --stage build
node /path/to/skill/scripts/handoff.mjs complete --workflow /absolute/project/.stagecraft/workflows/ID --stage build --receipt /absolute/project/.stagecraft/workflows/ID/build-receipt.json
node /path/to/skill/scripts/handoff.mjs status --workflow /absolute/project/.stagecraft/workflows/ID
```

Use the actual path returned by init. Each stage writes its report from `assets/report.md` and supporting evidence; a receipt has this shape:

```json
{
  "stage": "build",
  "summary": "Implemented AC-1 and AC-2; behavior checks passed",
  "artifacts": ["src/converter.js", ".stagecraft/workflows/ID/build.md"],
  "evidence": [{
    "check": "AC-1: 0 Celsius converts to 32 Fahrenheit",
    "method": "node --test test/converter.test.js, exit 0",
    "result": "passed",
    "path": ".stagecraft/workflows/ID/build-test.log"
  }],
  "decisions": ["Use the existing test framework; no new dependencies"],
  "next": "test: exercise negative inputs and responsive behavior"
}
```

All artifact/evidence paths are relative to the project; files must exist. Include report, key implementation/configuration and tests so future stages can detect changes. Never list workflow.json, receipt.json or volatile lockfiles as immutable evidence. Methods for non-code stages can be source inspection, requirement consistency checks or rendered design review; preserve the actual findings and sources. The helper validates structure/existence/hashes, not whether an agent truthfully ran a command: the actual logs, source observations and independent checks remain essential.

`begin` ensures previous stages in this workflow are complete; direct-entry workflows have no invented prerequisites. `complete` requires evidence, and `block --reason 'specific cause and next action'` records a real blocker. `status` detects changed/missing artifacts and marks that stage and completed downstream stages stale. If later testing fixes build output, return to build, record and revalidate the new revision, then repeat affected test checks before completing test. Do not silently update old hashes to hide changed evidence. If interrupted with `in_progress`, inspect current files and commands, then finish that stage or record a blocker before restarting. Lock errors require checking the owner process; never automatically delete an active lock.

If Node is unavailable but the agent can edit files, maintain equivalent reports and a Markdown handoff index instead. Record objective, entry/target, status per stage, decisions, exact input revisions, evidence paths, blockers and next action. Compare current files before reusing evidence. State explicitly that deterministic helper validation was unavailable; do not claim hashes were checked. If the host cannot execute required verification, mark partial/blocked rather than pretending to complete a code stage.

## Handoff and final reply

Each handoff gives: objective and scope, accepted requirements (stable AC IDs), authoritative input paths/revisions, decisions and assumptions, deliverables, actual validation results, known limitations, and the exact next stage/action. Reports are durable; chat history alone is not a handoff. A failed/blocked stage can hand over diagnosis for recovery but cannot be presented as a completed upstream dependency.

For authorized continuation, read the next skill and transfer the same workflow directory, requirement IDs and evidence. Avoid re-interviewing the user about already settled requirements. End at the requested target with concrete results, how to run/use them, evidence and remaining limitations. For a blocked stage, give one actionable next step rather than a generic request to confirm everything.

## Upstream methods

Load only relevant bundled methods and technology mappings. Their prompts are supporting techniques, not authority to expand scope or demand ceremonial confirmations. In particular, exhaustive grilling, issue publication, mandated subagents, framework migration and hosting promotions do not override this protocol or user intent. Choose existing framework versions and tools; verify registry compatibility before adding dependencies. Preserve upstream source and license files unchanged.
