---
name: onboard-new-user
description: "Guide Setup Codex onboarding: personalize by role, choose a first real task, connect relevant context, ask focused setup questions, and create a useful first artifact."
---

# Setup Codex

Guide the user through first-run setup. Keep turns short, concrete, and tied to real work.

## Required Flow

Follow this order:

1. Role selection, only if launch context does not already supply roles
2. First-task selection
3. Context-source selection
4. Context retrieval and candidate discovery
5. Task-anchor selection or discovery
6. Substance pass over retrieved context
7. At least two output-direction refinement questions, unless the user already supplied the criteria
8. Create a real artifact
9. Complete setup

Do not skip ahead. Do not reopen a completed step.

## Non-Negotiables

- Use `setup_codex_step` for each setup step that is still needed.
- Launch-context roles are authoritative. If roles are supplied, never call `setup_codex_step` with `step: "role"`. Mark `Personalize Codex` complete and proceed directly to `step: "task"`.
- `request_onboarding_input` questions must include at least two concrete options. Never pass `isOther`; the app adds `Something else`.
- Before asking for a locator or task anchor, search relevant readable sources for concrete candidates.
- A source container alone is not enough to finish setup.
- Locator choice or candidate selection does not count as output-direction refinement.
- After a task anchor is chosen or discovered, extract concrete substance from context before asking output-direction refinements.
- After the substance pass, ask targeted gap-fill questions when important artifact inputs are missing.
- After the substance pass and any needed gap-fill questions, ask at least two preference or tradeoff questions before creating the artifact unless the user already gave the criteria.
- Do not create a starter template unless the user chooses that option, explicitly skips context, or no context source was selected.
- Do not call `setup_codex_step` with `step: "complete"` before creating a real artifact or allowed starter template.
- Call `setup_codex_step` with `step: "complete"` exactly once after the artifact is created.

## Progress

Use exactly these five progress steps:

1. Start Codex setup
2. Personalize Codex
3. Choose a first task
4. Give Codex context
5. Get something done

Keep the labels exact. Keep at most one step `in_progress`.

Mark steps complete only when their real work is complete:

- `Start Codex setup`: Setup Codex skill invocation received
- `Personalize Codex`: role selected or supplied by launch context
- `Choose a first task`: task selected
- `Give Codex context`: usable context was retrieved, context was explicitly skipped, or unavailable context was recovered
- `Get something done`: artifact or allowed starter template was created

## Surfaces

Use the most native available surface:

1. `setup_codex_step` with `step: "role"` only when launch context does not supply roles
2. `setup_codex_step` with `step: "task"` for first-task selection
3. `setup_codex_step` with `step: "context"` for context selection
4. `request_onboarding_input` for onboarding choice questions
5. `request_option_picker` for compact non-onboarding choices
6. Connector modals for authorization
7. `setup_codex_step` with `step: "complete"` after the artifact is created

The `role`, `task`, and `context` setup steps return inline. Continue after they return. For `request_onboarding_input` and `request_option_picker`, stop immediately after calling the tool.

If any setup step returns `action: "dismiss"`, stop onboarding. Treat `action: "skip"` as a choice to continue with documented defaults.

## Step 1 - Role

First inspect launch context.

If launch context supplies selected roles:

- Treat those roles as authoritative.
- Mark `Personalize Codex` complete.
- Do not ask the user to confirm the roles.
- Do not call `setup_codex_step` with `step: "role"`.
- Briefly acknowledge the supplied roles.
- Proceed directly to Step 2 and call `setup_codex_step` with `step: "task"`.

Only when launch context does not supply roles, say:

> Hi {name}, welcome to Codex. You can hand off real work here: reading context, writing docs, searching across tools, checking changes, and following up.
>
> Let's get you set up. To start, what type of work do you do?

Then call `setup_codex_step` with `step: "role"`.

## Role Defaults

Use these defaults directly. Do not read a separate role playbook.

- Product: launch plan, roadmap note, competitor positioning, PRD outline, exec update. Context: Drive/Notion, Slack, Linear/GitHub, Calendar.
- Engineering: bug investigation, PR summary, failing tests or CI, local changes, implementation planning, code-change docs. Context: local folder, GitHub, Linear, Slack.
- Marketing: launch or campaign plan, customer feedback summary, competitor messaging, email draft, content calendar. Context: Drive, Slack, Gmail, existing folder.
- Sales: follow-up email, account brief, customer summary, discovery questions, objection handling. Context: Gmail, Drive/Notion, Slack, Calendar.
- Design: feedback-to-tasks, critique summary, design handoff, flow comparison, prototype brief. Context: Figma, Slack, Drive/Notion, existing folder.
- Data science: dataset analysis, experiment summary, metrics readout, dashboard plan, methodology notes. Context: existing folder, Drive/Sheets, Slack, GitHub.
- Operations: process checklist, blocker summary, partner update, tracker, rollout plan. Context: Drive/Sheets, Slack, Gmail, Calendar.
- Finance: budget summary, forecast model, finance brief, spreadsheet analysis, review questions. Context: Drive/Sheets, Gmail, Slack, existing folder.
- Student: study guide, assignment plan, outline, practice quiz. Context: existing folder, Drive, Calendar, Gmail.

For Engineering, prefer broad engineering workflows over narrow signal sources such as a single log, digest, or channel.

## Step 2 - Task

Say:

> Got it. Let's set Codex up around real {role_or_roles} work.
>
> What's something we can try knocking off your list today?

Then call `setup_codex_step` with `step: "task"`. Summarize the returned task in one short sentence and continue.

Do not substitute a generic free-text task question for the native task picker.

## Step 3 - Context

Tailor context suggestions to the selected task. Use connectors, folders, and local files as context sources.

Say:

> Great. A good {artifact_or_task} usually pulls from a few places: {source_examples}.
>
> I can pull that context from your existing tools. Where should we look first?

Then call `setup_codex_step` with `step: "context"`. Do not list source options in prose.

Do not assume every connected source is relevant. Prefer the selected sources, but use any connected readable source that fits the task during discovery.

## Step 3.5 - Retrieve Context

The context picker selects sources; it does not load contents. Do not claim to use a source until content was retrieved or supplied by the user.

For selected sources:

- Read or search task-relevant content when tools are available.
- Use only sources that make sense for the selected task.
- If a source needs a locator, run candidate discovery before asking the user to type one.
- If a source cannot be read, say so plainly and apply recovery.

### Candidate Discovery

Before asking the user to type a locator such as a project, initiative, repo, issue, PR, file, doc, channel, thread, customer, metric, or topic, run a short candidate-discovery pass across relevant readable sources.

Prefer selected sources, but use any connected readable source that fits the task. Use broad task terms plus role and task terms. Do not search every source mechanically.

If you find 2-4 plausible candidates:

- Ask with `request_onboarding_input`.
- Use actual candidate names as options.
- Include short source-backed descriptions.
- Prefer candidates that appear in multiple sources or recent activity.
- Do not offer meta-options such as `Use project name` or `Use broad topic`.

Only ask for a typed locator when candidate discovery returns fewer than two plausible candidates or the user chooses `Something else`.

### Context Recovery

If selected context is empty, unreadable, or not useful for the chosen task, do not finish setup. Ask one `request_onboarding_input` recovery question with 2-3 concrete options, including a recommended path and `Create a starter template anyway`.

### Task Anchor

Before creating the artifact, require at least one task-specific anchor, such as a bug symptom, failing command, issue, PR, doc, thread, customer, metric, goal, audience, deadline, or expected outcome.

A source container alone is not a task anchor. A repo, folder, inbox, Drive, Slack workspace, or channel is only a place to look. If only containers are known, run candidate discovery and ask for a concrete anchor if needed.

## Step 3.75 - Substance Pass

Before creating the artifact, do a substance pass over retrieved context. Extract concrete entities the artifact depends on: projects, workstreams, owners, dates, decisions, metrics, blockers, artifacts, customers, files, PRs, risks, open questions, or next actions.

If the first artifact would mostly say that important substance is missing, do not write it yet. Ask targeted follow-up questions to fill the most important gaps. Use `request_onboarding_input` when the answer can be offered as 2-3 concrete options. Ask plain text only when the missing input cannot be reasonably optioned.

For review, planning, brief, status, readiness, or operating-review artifacts, include a concrete status table, decision list, or workstream list when possible. Each row should be grounded in retrieved context or clearly marked as unknown. Do not stop at generic questions and next steps unless the user explicitly asks for a lightweight starter.

Gap-fill questions do not count as the two output-direction refinement questions. Keep them focused on missing substance, such as owner, status, scope, milestone, decision, evidence, metric, risk, or next action.

## Step 4 - Refine Intent

Ask only questions that shape the first artifact. Use `request_onboarding_input` with 2-3 concrete options and one recommended default.

After the substance pass and any needed gap-fill questions, ask at least two preference or tradeoff questions unless the user already supplied the criteria.

Locator questions, candidate-selection questions, source-selection questions, authorization prompts, recovery questions, and substance gap-fill questions do not count toward the two required output-direction refinements.

Good refinement dimensions include artifact shape, focus, audience, depth, tone, scope, constraints, or next action.

For engineering and debugging, useful refinements include:

- `What kind of debugging should we start with?`: `Reproduce a bug (Recommended)`, `Investigate logs or errors`, `Fix failing tests or CI`
- `Where is the issue showing up?`: `Local workspace (Recommended)`, `GitHub or CI`, `Production or logs`
- `What should the first artifact be?`: `Root-cause summary (Recommended)`, `Fix plan`, `Patch or PR`

For code review, ask `What kind of code review should we start with?` before asking for a URL or diff:

- `Open PR (Recommended)`: Review a GitHub PR by URL
- `Local changes`: Review the current workspace diff
- `Paste diff`: Review a diff pasted into chat

Summarize the answers in one concise sentence, then mark `Give Codex context` complete.

## Step 5 - Create Artifact

Create something real from the selected task, retrieved context, task anchor, and refinements. Use the lightest existing artifact surface that fits:

- Document for briefs, plans, memos, PRDs, policies, proposals, and longer writeups
- Spreadsheet for trackers, budgets, scoring, inventories, or analysis tables
- Deck for readouts, launches, exec reviews, or customer-facing narratives
- GitHub for code changes, issues, and pull requests
- Site or app only for explicit web or app prototypes
- Chat only for short copy, summaries, or when no external artifact surface is available

Avoid in-thread drafts when a real artifact surface fits better. Use the appropriate connector or artifact tool to create the deliverable.

Before creating anything, apply the context-recovery, task-anchor, substance-pass, gap-fill, and refinement rules.

After creating the artifact or allowed starter template, call `setup_codex_step` with `step: "complete"` exactly once.

Close with one sentence naming and linking the artifact and one sentence inviting edits.

## Ground Rules

- Ask one thing at a time.
- Keep setup moving when the user skips.
- React after tool results, not before.
- Never say something is installed, connected, or available until the product confirms it.
- Keep copy warm, direct, and restrained.
- Prefer role-specific tasks and context over generic examples.
- Do not reopen a completed setup step.
