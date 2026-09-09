---
name: blue-yellow-development-loop
description: Coordinate Blue-Yellow development when Blue can change shared code but cannot independently exercise the real Yellow-zone runtime, business integration, permissions, packaging, or environment. Use during development to add temporary diagnostics, maintain a chronological handoff, and turn Yellow log analysis into the next minimal Blue change; also use at pre-submit readiness to remove development-only instrumentation.
---

# Blue Yellow Development Loop

Use this loop when realistic evidence must come from Yellow. Blue owns source analysis and changes; the user owns starting the environment and performing the real operation; Yellow AI owns log inspection, problem analysis, and a compact report back to Blue.

Do not invoke this loop when Blue can exercise and inspect the complete behavior locally.

## Start a loop

1. Trace the shared-code path and identify the smallest fact that the Yellow runtime must reveal.
2. Make the minimum development change. Add temporary diagnostics when existing evidence cannot distinguish the remaining causes.
3. Give diagnostics one stable feature prefix and fixed sequence labels such as `[lite-share][R01-01]`. Number expected execution order in source; never derive sequence numbers from runtime history.
4. Log boundaries, routing choices, stable identifier presence, loaded path or version when relevant, and concise outcomes. Exclude secrets, tokens, cookies, credentials, complete prompts, complete user content, and oversized payloads.
5. Create one repository handoff Markdown, preferably under `docs/diagnostics/`, by adapting [the handoff template](assets/yellow-handoff-template.md).

Treat source, built artifact, installed files, and the currently running process as separate identities. Ask for identity evidence only where it can distinguish the current hypotheses.

## Maintain the handoff

The handoff is a chronological development record. Append rounds from top to bottom and retain earlier questions, reports, conclusions, and changes. Do not rewrite history to show only the latest state.

For every round:

1. Append one numbered round at the bottom.
2. Mark it `等待黄区分析` and state exactly one current unresolved question.
3. Record the Blue change, expected call path, relevant fixed log markers, user operation, evidence Yellow should inspect, competing conclusions, and stop condition.
4. End the round with the fixed Yellow reply template.
5. Tell Yellow AI to locate the final round marked `等待黄区分析`, analyze that round only, and avoid repeating earlier resolved work.
6. After the user returns Yellow's reply, append the reply and Blue's evidence-based conclusion beneath that round. Mark it `已分析`, then append the next round if another question remains.

Historical rounds are evidence. Keep them concise but intact. Put new corrections in the next appended entry instead of silently changing the old conclusion.

## Yellow boundary

Yellow AI does not start services, build, install, click through the product, reproduce the flow, modify code, or claim validation. The user performs those actions and tells Yellow AI when the evidence is ready.

Yellow AI reads the handoff and requested logs, analyzes the latest waiting round, and returns only:

- requested marker presence or absence;
- loaded path, version, process, or runtime identity when requested;
- observed success or failure;
- first meaningful error or stopping boundary;
- one evidence-based conclusion answering the current Blue question.

Use an evidence-only relay. Values absent from the requested runtime logs are `未确认`; Yellow must not fill them from source inspection, artifacts, prior context, or likely explanations. Static reasoning may identify a hypothesis only when the current round explicitly requests it, and must never be labeled as runtime evidence.

Make the output boundary mechanical: require exactly the lines in the fixed reply template, with no heading or prose before or after them. The final `结论` line is the stop token. Reserve `蓝区结论`, repair selection, and the next action for Blue. Yellow replies in chat; Blue appends the reply to the handoff.

Prefer compact evidence around the requested markers. Full logs and repeated background make the relay harder to use.

## Continue in Blue

Use the returned facts to decide the next smallest code change or diagnostic question. Distinguish an absent marker caused by stale build or runtime identity from an actual call-path failure. Append the outcome to the same handoff before starting another round.

Stop the loop when the user-observed flow succeeds and the evidence answers the current question, or when progress needs a product decision rather than more runtime evidence.

## Pre-submit cleanup

When the user says `我准备上库了`, `代码要上库了`, `上库前检视`, `提交前检视`, or an equivalent readiness phrase, inventory everything introduced solely for this development loop and remove it before the requested review or delivery:

- temporary numbered diagnostics and verbose tracing;
- diagnostic flags, probes, harnesses, and temporary IPC or UI hooks;
- temporary fallback branches or hardcoded local-test behavior.

Preserve the requested product behavior and diagnostics that are independently justified for production. Check the diff and the chronological handoff to account for every temporary addition; do not rely on memory. Mark the handoff complete or follow the repository's documentation policy, while retaining its development history unless the user asks to remove it.
