---
name: matrix-real-scenario-testing
description: "Run fast real-scenario validation for MatrixAssistant_5106 through the actual Electron app, Gateway, SDD or user flow, artifacts, and runtime logs. Use automatically in the MatrixAssistant_5106 repository when the user asks for 真实测试, 实际场景验证, 端到端验证, or 启动程序验证; do not substitute unit tests or function probes for the requested runtime evidence."
---

# Matrix 真实场景测试

Target repository: the active `MatrixAssistant_5106` checkout. Resolve it from the current working directory or Git root instead of assuming a fixed home-directory path.

Produce an evidence-backed result from the real product path with the shortest reliable loop. Optimize first for reuse: keep a matching runtime alive, reuse installed dependencies and pnpm caches, and avoid rebuilding layers unaffected by the change.

## Tight loop

1. Define the observable scenario before starting. Name the user operation, expected UI or state result, required artifact, and decisive log markers. Completion requires evidence from each boundary the changed behavior actually crosses.

2. Inspect live state before launching anything:
   - confirm the checkout, branch, dirty files, and changed surfaces;
   - inspect existing MatrixAssistant, Vite, Electron, and Gateway processes and ports;
   - reuse a running instance only when it belongs to this checkout and contains the required renderer, preload, main-process, resource, or plugin changes.

3. Choose the minimum refresh:
   - renderer-only changes may use the active Vite session;
   - main, preload, bundled resource, startup, or plugin changes require the affected process to restart;
   - preserve unrelated worktree changes and keep already-valid runtime layers running.

4. Restore only a dependency that blocks the target flow. Before any pnpm command, unset `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` and their lowercase variants. Prefer existing `node_modules` and the pnpm store. For a missing workspace link, use a filtered cached install that does not update `pnpm-lock.yaml`; use a broader or network-backed install only when the required package is absent from cache and the target cannot run without it.

5. Launch through the repository's current `package.json` script. Use the normal or Yellow-zone variant that matches the requested runtime. Watch until the app window, Gateway, and target feature are ready; readiness is evidence from the current process, not merely a successful source build.

6. Exercise the actual user path. For SDD work, select the intended SDD in the client, send the real scenario through Gateway/Agent execution, and observe the real output artifact and state transition. A function call, parser probe, manually fabricated artifact, or static source trace is supporting evidence only.

7. Capture compact evidence: runtime identity, scenario input label without sensitive content, boundary markers in order, artifact path and result, visible outcome, and the first meaningful error. Never print tokens, credentials, full prompts, or full user content.

## Recovery budget

- Give an unrelated startup or environment problem one focused recovery attempt. If it remains, keep reusable processes running, report the exact blocker, and ask the user for the minimum human action.
- Ask immediately when login, first-run setup, permissions, CAPTCHA, or physical UI operation requires the user. Do not spend time trying to bypass a human boundary.
- Treat warnings as noise only after confirming that the target app, Gateway, and flow remain reachable. Record non-blocking noise once and continue.
- During ongoing work, update the user within 60 seconds and state which real boundary is currently being exercised.

## Boundaries

- If the feature has no runtime caller, say that the requested E2E is not yet possible. Present the minimum real-path wiring and obtain approval before adding a development bridge.
- In the development phase, run the focused functional scenario; leave automated suites, lint, typecheck, coverage, packaging, and release gates for an explicit pre-submit request.
- Keep source, generated build, installed artifact, configuration, and running process identities separate. A result is valid only for the identity actually exercised.
- In a Yellow environment, use the `blue-yellow-development-loop`: the user performs build/install/start/UI operations, Yellow AI inspects requested logs, and Blue owns source changes and conclusions.

## Report

Return:

```text
Result: PASS | FAIL | BLOCKED
Scenario: <actual user path exercised>
Runtime: <checkout/build/process identity>
Evidence: <ordered markers, artifact, and visible outcome>
First blocker: <one line or none>
Conclusion: <what this proves, with untested boundaries stated>
```

Never label the feature end-to-end verified when the real user operation or one of its required runtime boundaries was not exercised.
