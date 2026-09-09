---
name: pre-submit-code-review
description: Use when the user asks for 上库前检视, 提交前检视, 增量检视, code review, lint/typecheck verification, logging compliance review, exception-handling consistency, security-sensitive logging checks, or low-level bug checks on local changes, a commit, branch range, or PR.
---

# Pre-Submit Code Review

Perform an evidence-based incremental review of the requested change set. Default to read-only review.

## Incremental Review Boundary

Review only code added or modified inside the requested diff.

- A finding must be caused by an added or modified line and must point to that diff line.
- Read unchanged callers, callees, schemas, tests, and surrounding code only to understand the changed line's behavior.
- Do not report pre-existing defects, lint errors, type errors, logging issues, style problems, or missing tests outside the diff.
- Report an old-code problem only when a changed line newly activates it, makes it reachable, or materially worsens its impact. Anchor the finding on the responsible changed line and explain the causal link.
- Do not expand the review into a repository-wide audit merely because repository-wide commands expose unrelated failures.

## Enforce Change Ownership and Necessity

Require every changed line to trace to the stated requirement, a necessary compatibility change, or verification of that behavior.

- Treat unrelated cleanup, formatting, import removal, renaming, comment rewriting, and opportunistic refactoring as scope creep even when technically safe.
- Report scope creep as a finding anchored to the unnecessary diff line; default to `P3`, raising severity only when it creates concrete behavioral risk.
- Do not excuse a change merely because code was unused, style improved, or tests still passed. Require evidence that the requested work needed it.
- Do not modify or recommend modifying adjacent code owned by others unless the requested change makes that modification necessary.
- When a seemingly unrelated change is required for lint, typecheck, build, compatibility, or a direct dependency, state the causal chain and verification evidence. Otherwise recommend restoring the original code.
- During review, ask of every changed hunk: "Would the requested behavior still work if this hunk were reverted?" If yes, flag it unless the user explicitly authorized cleanup or refactoring.

## Establish Scope

1. Read the applicable `AGENTS.md` files and repository instructions.
2. Use the scope named by the user: working tree, staged changes, commit, branch range, or PR.
3. If no scope is named:
   - Review staged and unstaged changes, including relevant untracked files.
   - If the worktree is clean, review `HEAD`.
4. Capture the exact changed-line ranges with `git diff --unified=0` or an equivalent structured diff before reviewing.
5. Read complete changed files plus direct callers, callees, schemas, and nearby tests when needed, while preserving the incremental reporting boundary.

## Run Static Checks

1. Inspect package-manager configuration and available scripts before running commands.
2. Run the repository's configured lint command and typecheck command exactly as intended by the project.
3. Honor repository environment rules, including proxy removal, registry choice, workspace filters, and required binaries.
4. In monorepos, verify whether the root typecheck covers changed packages. If it does not, run the narrow package-level check prescribed by repository instructions or explicitly report the uncovered scope.
5. If a repository-wide command fails, compare diagnostics against changed files and changed-line ranges. Run a targeted check when supported to isolate the increment.
6. Treat diagnostics outside the diff as baseline noise: summarize their existence, but do not list them as findings.
7. Do not install dependencies or rewrite configuration merely to make checks run.
8. Record command, exit status, errors, warnings, and which diagnostics are attributable to the reviewed increment.

## Review Logging

Inspect only added or modified `console.*`, logger calls, tracing, telemetry, and stderr/stdout writes, plus logging behavior newly reached by changed control flow. Compare them with logging patterns in the same subsystem.

Check for:

- inappropriate log level or use of `console` where the subsystem uses a logger;
- debug or temporary tracing left enabled in production paths;
- user messages, prompts, file contents, credentials, tokens, environment variables, personal data, internal paths, or full payloads entering logs;
- raw error objects or serialized responses exposing sensitive fields;
- high-frequency logs in loops, streaming handlers, render paths, or retry paths;
- misleading error-level logs for normal lifecycle events;
- logs that are impossible to correlate, redact, disable, or classify;
- swallowed failures where logging is the only handling but callers require a result.

Treat intentional IPC or trace transport separately from diagnostic logging. Verify its payload is minimal and its parser, retention, and forwarding path are appropriate.

## Review Exception Handling and Local Style

Compare added or modified exception handling with nearby code and sibling implementations owned by the same subsystem. Use unchanged handlers as reference, not as findings.

Check for:

- empty or silent `catch` blocks;
- fire-and-forget promises without deliberate rejection handling;
- caught errors that should be returned, rethrown, translated, or surfaced;
- inconsistent error types, messages, logging levels, fallback values, or cleanup;
- broad catches hiding programming errors;
- duplicate handling across layers;
- changed behavior that bypasses an established helper, contract, or boundary;
- user-visible error text that bypasses i18n when the repository requires it.

Do not demand global stylistic uniformity. Match the closest relevant subsystem and explain concrete behavioral impact.

## Check Low-Level Correctness

Inspect changed lines and the behavior they introduce for:

- incorrect conditions, inverted branches, missing guards, and unreachable code;
- null/undefined access, unsafe assertions, schema drift, and mismatched event shapes;
- wrong identifiers, imports, paths, configuration keys, or tool names;
- async races, duplicate events, stale state, missing cleanup, memory growth, and lifecycle leaks;
- accidental processing of every generic event for one feature-specific case;
- off-by-one errors, empty collections, malformed input, and boundary cases;
- duplicate side effects, non-idempotent retries, and ordering assumptions;
- security or trust-boundary violations caused by unvalidated external data;
- missing regression coverage for meaningful behavior changes.

Use tests and source traces as evidence. Do not speculate when the behavior can be confirmed locally.

## Report Findings First

Order findings by severity:

- `P0`: release-blocking data loss, remote compromise, secret exposure, or broadly unusable behavior.
- `P1`: high-impact correctness, security, startup, or primary-workflow failure.
- `P2`: real but narrower defect, lifecycle issue, maintainability risk with concrete impact, or important missing coverage.
- `P3`: minor issue worth fixing before submission.

For every finding include:

- severity and concise title;
- clickable file and exact line;
- triggering scenario and observable impact;
- evidence from code, checks, or tests;
- a focused remediation direction without editing the code.

Before reporting a finding, verify that its referenced line is present in the requested diff. If it is not, omit it unless a changed line demonstrably activates or worsens it; in that case, reference the responsible changed line instead.

After findings, report:

1. lint result, separating increment-attributable diagnostics from repository baseline failures;
2. typecheck result and actual scope covered, separating increment-attributable diagnostics from repository baseline failures;
3. logging review result;
4. exception-style consistency result;
5. tests run or remaining test gaps;
6. residual risks.

If no findings exist, state that clearly and still report verification coverage and residual risks. Never claim a check passed unless it was run successfully in the current review.
