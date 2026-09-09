## Workspace memory

- 知识目录：`$HOME/.restx/knowledge`。用户说“把某某文档放在知识目录下”时，统一指这个目录。
- For knowledge-seeking questions, answer the concrete question first. When it adds value, include a brief "Memory Hook" that abstracts the answer into a reusable principle, decision framework, or analogy. Favor concise, transferable insight over repetition; omit it for simple factual questions where it adds noise.
- Maintain independent, evidence-based judgment. When the user's premise, approach, or conclusion is incorrect, incomplete, risky, or poorly supported, state the concern directly before proceeding. Explain the evidence and impact, recommend a better alternative where possible, and distinguish verified facts, reasonable inferences, and uncertainty.

## Development workflow

- Treat coding work as being in the **development phase** by default. Remain in that phase until the user explicitly says the code is ready to go upstream and requests a review, for example: “代码要上库了”, “上库前检视”, “提交前检视”, or an equivalent unambiguous instruction.
- During development, implement the requested functionality directly and keep changes focused. Defer unit, integration, and end-to-end test creation; automated test suites; ESLint; typecheck; coverage; security or sensitive-information scans; packaging checks; pre-commit gates; and similar repository-quality gates.
- Functional testing is separate from deferred repository gates. For a complex requirement, especially one involving multiple modules, IPC or process boundaries, runtime state, or a substantial user flow, run the real application or closest realistic runtime and perform a focused end-to-end functional check of the primary user-visible flow.
- When Blue can change shared code but cannot exercise the real environment, use the `blue-yellow-development-loop` Skill for diagnostic logging, handoff maintenance, Yellow-zone evidence collection, runtime-identity checks, and pre-submit cleanup. Treat that Skill as the authoritative source for the detailed Blue–Yellow process.
- A request to commit or amend code does not enter the pre-submit review phase. Commit or amend the requested changes without automatically running verification gates unless the user also explicitly requests pre-submit review.
- Repository instructions and Skills may describe development-time TDD or quality gates. This standing user preference defers automated test creation and repository gates until explicit pre-submit review while retaining the focused functional-testing requirement for complex work.
- Read-only source inspection, log inspection, diagnostic tracing, and focused functional testing needed to understand or validate a change are allowed during development. Keep them scoped to the changed behavior.
- During explicit pre-submit review, perform the relevant work in one consolidated pass: review the diff, add only valuable regression tests, then run the applicable tests, ESLint, typecheck, build, coverage, sensitive-information scan, packaging, or repository gates. Fix findings and rerun only affected checks unless a broad change invalidates earlier evidence.
- If the user explicitly requests one particular check during development, run only that check. A one-off check does not enter the full pre-submit review phase.
- For medium or large changes, clarify materially ambiguous requirements before implementation. Use brainstorming or a specification workflow only when it materially reduces product or architectural risk; do not let process artifacts delay straightforward work.

## Environment dependencies

- Before running pnpm commands, unset `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `http_proxy`, `https_proxy`, and `all_proxy`. By default, use the configured registry mirror unless the user explicitly requests proxy-backed behavior.
- Prefer locally cached dependencies. When a required dependency is unavailable locally, fetch it into the shared or global dependency cache so later tasks can reuse it.
