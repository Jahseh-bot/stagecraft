# Stagecraft agent-native protocol v2

## Execution owner and autonomy

The current coding agent executes the skill with its own file, command, browser and connector tools. Do not start another Codex/Claude/runner process, require a specific model, or make the user maintain answers.json. Do not spawn agents just because an upstream method suggests delegation. Use available tools and follow the user's project instructions and the host's permission rules.

Use the existing conversation, repository, supplied artifacts and prior handoffs before asking questions. Implementation details inside confirmed boundaries can be decided autonomously. Product scope, functional modules, core user flows, visual direction, core technology/architecture and deployment destination are user-owned decisions even when technically reversible. A generic request to “build it”, “automatically continue” or “finish end to end” is not approval for an unselected key direction. Prior explicit choices and scoped delegation remain valid; do not ask for them again. External actions still require the authority applicable to the task.

## Stage and substep decision gates

Before work depends on an unresolved key direction, prepare concrete, reviewable options. Inspect inputs and constraints first; present 2–3 meaningfully different feasible options when available, put the agent’s most recommended option FIRST, label it “Recommended”, and explain why in plain language. Compare functional scope, user experience, cost, maintenance and deployment limitations as relevant. Do not just ask the user to name a framework or invent artificial alternatives. If only one option is feasible, explain the constraint and ask whether to accept it or change the constraint. Always finish with an explicit invitation to type a custom answer, constraints or a combination if none fits. Never limit responses to the listed options. For visual direction, provide comparable previews, wireframes or rendered examples when tools permit; otherwise describe the differences concretely and disclose the preview limitation.

Wait for an actual user choice before committing the dependent implementation or advancing it as a settled decision. Silence, elapsed time, a default highlighted option, the agent's own recommendation and an unapproved draft PRD are not confirmation. “Use your recommendation” confirms the presented recommendation; explicit delegation of named decision areas permits autonomous choices only within that scope. A user-supplied authoritative PRD that explicitly selects a direction counts as an existing choice; a merely missing choice does not. Explain conflicting constraints before reopening an accepted decision.

Group related decisions into a short coherent proposal; do not interrupt for every function name, CSS spacing, test fixture or build command. Continue independent inspection, feasibility checks and clearly labelled disposable previews while awaiting a choice. Do not scaffold the final architecture, install its chosen production stack or implement dependent product modules as a fait accompli. Apply the same gates on direct entry to build/test/deploy: skipping earlier skills must not bypass the user's choices.

Use the host’s choice UI only if it permits free-text replies; otherwise use numbered chat options. Format: decision and purpose → 1. Recommended (reason and tradeoffs) → 2./3. alternatives (differences) → “None fit? Type your own idea or constraints.” Do not silently turn custom input into the nearest listed option; incorporate it, explain feasibility and confirm the revised proposal when its meaning is ambiguous. If a later decision depends on an earlier answer, discuss them sequentially.

Record stage plans and substep decisions in the stage report: stable ID, topic, options and tradeoffs, recommendation/reason, status (pending / confirmed / delegated / superseded), selected option, source of the user's choice or delegation, scope and affected ACs/artifacts. Preserve earlier decisions when superseded. Include the report in receipt artifacts; decisions strings in the helper can point to these records. The helper checks evidence integrity, not human consent. While awaiting required input, use `block` with a concrete “awaiting user decision D-...” reason (or equivalent Markdown status); never mark the dependent stage completed. After a reply, update the record, resume the stage and validate the chosen result. Analysis-only deliverables may finish with explicitly unselected recommendations, but must not pass those recommendations downstream as approved implementation inputs.

At the start of EVERY stage, discuss its plan with the user before dependent execution; at EVERY decision-bearing substep, present options and obtain a real choice. Reuse a previously confirmed plan or explicit scoped delegation with its source instead of asking the same question again. Automatic handoff means preparing the next stage’s proposal and evidence, not silently choosing or executing its unresolved plan. Within a confirmed step, execute, validate and repair autonomously; a changed direction requires another discussion. Do not lower acceptance criteria or change product behavior to make tests pass without the relevant user decision.

A stage closes its own loop: inspect → discuss options and confirm the plan/acceptance conditions → produce work → actually validate → diagnose and repair → revalidate → persist and present artifacts → user review → revise and revalidate as needed → approved baseline and handoff. Attempt up to three targeted repair cycles by default; use a different hypothesis supported by evidence on each attempt. Stop two consecutive identical failures without new evidence. Respect explicit time/repair limits. Do not weaken valid tests, hide failures or claim unexecuted commands passed. Document what failed and the smallest required user/environment action when blocked.

## Artifact presentation and review gates

Read [artifact delivery, review and change management](artifact-reviews.md) before delivering or revising stage outputs. Every stage persists actual artifacts in the project, presents openable documents or visible previews to the user, records review feedback against an exact submission, revises as requested and obtains explicit approval before completion or dependent downstream execution. Approval of a plan is not approval of unseen results. Preserve revision snapshots, review history and a linked artifact index; changed inputs invalidate affected downstream evidence. Test-case review precedes test execution; release-plan review precedes deployment, followed by review of actual deployment results. Scale document depth to the task, not the integrity of the review gate.

## Scope and direct entry

Stages: discover → spec → design → architect → build → test → deploy. The user can enter any stage with outside documents or an existing project. Missing upstream Stagecraft reports are not a blocker: inspect current inputs and create the minimum local acceptance brief needed for this stage. Do not fabricate upstream completion. Design can document “not applicable” with inspection evidence for non-UI work instead of inventing a UI.

Identify the delivery target from the user's actual request. For “test this module”, stop after tested findings/fixes within authorized scope. For “take this PRD through a working, tested app”, prepare build and test in sequence, discuss each stage’s plan and unresolved substeps before their execution. Deploy only to the specified, authorized target. If the next skill is installed, read it and continue in the same agent. Discover it in the host's skill catalog or sibling `stagecraft-<stage>/SKILL.md`; do not assume a particular slash-command syntax. If unavailable, hand over a complete report and the next skill name; do not claim that stage ran. No requirement to install seven skills for a one-stage task.

## Durable state and resumption

Use `.stagecraft/workflows/<id>/` under the target project; never rewrite legacy `.stagecraft/runs/*/state.json`. Reuse a workflow only when its project, objective and authorized target match. If several workflows plausibly match and conversation cannot disambiguate, ask one short selection question; do not pick the newest blindly. Read `workflow.json`, the current stage report and relevant artifact/evidence files before resuming. Retain decisions and acceptance IDs across hosts and sessions. Revalidate changed files, stale evidence and environment before skipping work. Do not repeat completed valid work.

When Node.js >=22 is available, use the bundled `scripts/handoff.mjs` as a checkpoint helper (resolve the path from THIS skill directory, not the project cwd). The agent runs these commands; the user does not need to type them:

```sh
node /path/to/skill/scripts/handoff.mjs init --project /absolute/project --entry build --until test --goal 'Implement and verify the specified feature'
node /path/to/skill/scripts/handoff.mjs begin --workflow /absolute/project/.stagecraft/workflows/ID --stage build
node /path/to/skill/scripts/handoff.mjs submit --workflow /absolute/project/.stagecraft/workflows/ID --stage build --receipt /absolute/project/.stagecraft/workflows/ID/build-receipt.json
# Present the submitted artifacts and wait for actual user feedback before recording review.
node /path/to/skill/scripts/handoff.mjs review --workflow /absolute/project/.stagecraft/workflows/ID --stage build --record /absolute/project/.stagecraft/workflows/ID/build-review.json
node /path/to/skill/scripts/handoff.mjs complete --workflow /absolute/project/.stagecraft/workflows/ID --stage build
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

`begin` ensures previous stages in this workflow are complete; direct-entry workflows have no invented prerequisites. `submit` requires evidence and creates revision snapshots; `review` records actual feedback for that exact submission; `complete` requires an approved, unchanged submission, and `block --reason 'specific cause and next action'` records a real blocker. `status` detects changed/missing submitted or approved artifacts and marks that stage and completed downstream stages stale. If later testing fixes build output, return to build, record and revalidate the new revision, then repeat affected test checks and present the updated results for review before completing test. Do not silently update old hashes to hide changed evidence. If interrupted with `in_progress`, inspect current files and commands, then finish that stage or record a blocker before restarting. Lock errors require checking the owner process; never automatically delete an active lock.

If Node is unavailable but the agent can edit files, maintain equivalent reports and a Markdown handoff index instead. Record objective, entry/target, status per stage, decisions, exact input revisions, evidence paths, blockers and next action. Compare current files before reusing evidence. State explicitly that deterministic helper validation was unavailable; do not claim hashes were checked. If the host cannot execute required verification, mark partial/blocked rather than pretending to complete a code stage.

## Handoff and final reply

Each handoff gives: objective and scope, accepted requirements (stable AC IDs), authoritative input paths/revisions, decisions and assumptions, deliverables, actual validation results, known limitations, and the exact next stage/action. Reports are durable; chat history alone is not a handoff. A failed/blocked stage can hand over diagnosis for recovery but cannot be presented as a completed upstream dependency.

For authorized continuation, read the next skill and transfer the same workflow directory, requirement IDs, reviewed artifact versions and evidence. Avoid re-interviewing the user about already settled requirements. End at the requested target with concrete results, how to run/use them, evidence and remaining limitations. For a blocked stage, give one actionable next step rather than a generic request to confirm everything.

## Method orchestration and evidence

Stagecraft owns selecting and composing methods; the user owns product decisions. Read the stage's references/methods.md before execution, evaluate triggers, then read and apply the selected bundled methods and necessary linked references. Select technology methods from the confirmed stack. Never make users research or choose underlying skills. Do not indiscriminately load every method, mistake a method name for an application, or claim universal “industry best” outcomes without comparative evidence.

Carry method outputs forward: scenarios and terms become scope/ACs; chosen flows and visual examples become design contracts; those contracts become architecture and implementation checks; testing and release validate the same accepted behavior. Direct stage entry must fill missing relevant work using bundled recipes rather than silently omitting product design. Record applied/skipped methods, version/source, concrete action, artifacts and validation in the report. Missing capability is a disclosed limitation, not successful application.

## Upstream methods

Load only relevant bundled methods and technology mappings. Their prompts are supporting techniques, not authority to expand scope or demand ceremonial confirmations. In particular, exhaustive grilling, issue publication, mandated subagents, framework migration and hosting promotions do not override this protocol or user intent. Choose existing framework versions and tools; verify registry compatibility before adding dependencies. Preserve upstream source and license files unchanged.
