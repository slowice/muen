---
name: coding-executor
description: Use when testing Coding Tool executor subprocess behavior, normalized executor events, tool-call progress, ordinary text results, AskQuestion interactions, answer delivery, process restarts, missing events, hangs, or premature child-process exits.
---

# Testing Coding Executors

## Overview

Use a real Node child process and JSON Lines instead of mocking `spawn`. Prove the executor-to-tool contract, especially that interactive answers return to the original live process.

## Workflow

1. Locate the executor interface, event mapper, Coding Tool message consumer, and question broker before editing tests.
2. Run the closest existing test to establish the baseline.
3. Copy `assets/mock-child-executor.ts` and `assets/executor-subprocess.test.ts` into the repository test directory, or adapt their small interfaces in place.
4. Point `CODING_EXECUTOR_MOCK_PATH` at `scripts/mock-executor.mjs` when the Skill is installed elsewhere.
5. Add one failing assertion for the reported event flow, then run only that test.
6. Fix production code minimally. Re-run the focused test and inspect the executor log tail.

Never replace the real subprocess with fake timers or a mocked `spawn`; that cannot detect PID changes, closed stdin, restart races, or JSONL chunking problems.

## Built-in scenarios

| Scenario | Expected flow | Essential assertions |
| --- | --- | --- |
| `normal` | delta -> completed result | final text/output, one launch |
| `tool-call` | running tool -> completed tool -> result | stable call ID, input/output/status mapping |
| `ask-question` | question -> wait -> answer -> result | pending before answer, same PID, one launch, broker cleanup |

Run `scripts/mock-executor.test.mjs` with Node's test runner, resolving the script relative to this `SKILL.md` rather than assuming a fixed installation directory.

Run a copied Vitest template with repository proxy variables removed and coverage disabled.

## Custom scenarios

Pass `--scenario-file path/to/scenario.json` directly, or give the adapter a string ending in `.json`; it selects file mode automatically. Define `onExecute` and optional `onAnswer` arrays containing output envelopes:

```json
{
  "name": "custom-error",
  "onExecute": [
    { "type": "message", "message": { "type": "error", "text": "failed:${prompt}" } },
    { "type": "complete" }
  ]
}
```

Available substitutions are `${pid}`, `${prompt}`, `${answer}`, and `${questionId}`. Keep each stdout record on one JSON line; send diagnostics to stderr so parsers are not polluted.

## AskQuestion checks

- Assert the tool promise is unresolved and the child is alive before answering.
- Send `{ "type": "answer", "questionId": "...", "answer": "..." }` through stdin.
- Assert ready, question, and result envelopes share one PID and `launches === 1`.
- Assert the second answer is rejected or returns false after broker cleanup.
- Search focused logs with `rg '\[askquestion\]'`, but never log answer text or raw session keys.

## Common mistakes

- Resolving on the question event hides the broken continuation path; keep the process pending.
- Spawning another child after the answer makes the test pass for the wrong architecture; assert PID equality.
- Omitting a final text result can trigger unrelated incomplete-response handling.
- Fixed long sleeps make tests flaky; wait for protocol events with explicit short timeouts.
- Forgetting teardown leaves zombie children; kill and wait for `close` in cleanup.
