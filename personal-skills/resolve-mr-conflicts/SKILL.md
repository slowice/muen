---
name: resolve-mr-conflicts
description: Resolve conflicts for a fork-based merge request by confirming its origin source and upstream target branches, synchronizing the target locally, resolving conflicts semantically, committing the merge, pushing the same source branch to origin, and confirming the MR update. Use when the user says 解冲突, asks to resolve MR conflicts, or wants to merge an upstream target branch into an existing MR source branch.
---

# 解冲突

Update the existing MR without replacing it: merge its verified upstream target branch into its verified origin source branch, resolve every conflict, create the merge commit, and push that same source branch to `origin`.

## Guardrails

- Treat an explicit request to use this skill as authorization for the normal push required by this workflow, limited to `origin/<MR-source-branch>`.
- Preserve unrelated local changes and commits. Stop when they prevent a safe checkout or merge; report the exact paths or commits instead of stashing, resetting, or discarding them.
- Push only to the verified MR source branch on `origin`. Never push to `upstream`, force-push, change the MR source or target, or create a replacement MR.
- Resolve conflicts from source intent. Never choose an entire side mechanically with blanket `ours` or `theirs`.
- Read and follow the repository's applicable agent instructions. Run only the validation they or the user require for this phase.

## Workflow

### 1. Confirm the MR topology

Inspect the repository before mutation:

```bash
git status -sb
git branch --show-current
git rev-parse HEAD
git remote -v
git branch -vv
```

Obtain the MR URL or number from the request or available Git provider tooling. Read the MR metadata and identify all four values:

- source repository and branch, which must map to `origin/<source-branch>`;
- target repository and branch, which must map to `upstream/<target-branch>`.

Verify the remote URLs against the MR repositories. If `upstream` is absent, add it only from the verified MR target-repository URL. If an existing `origin` or `upstream` points somewhere inconsistent with the MR, stop and report the mismatch. Never guess the target from the repository default branch.

Complete this step only after reporting the exact MR URL, `origin/<source-branch>`, `upstream/<target-branch>`, current branch, and current HEAD.

### 2. Synchronize the source branch locally

If a merge or rebase is already in progress, confirm it belongs to this exact MR synchronization before continuing. Otherwise stop and describe the active operation.

Fetch only the relevant remotes and branches, then check out the source branch:

```bash
git fetch origin <source-branch>
git fetch upstream <target-branch>
git switch <source-branch>
```

Compare the local source with `origin/<source-branch>`. Fast-forward when the local branch is only behind. Preserve local-only commits when it is only ahead. If both sides have unique commits, stop and report the divergence rather than choosing a history strategy silently.

Merge without rebasing or rewriting the shared MR branch:

```bash
git merge --no-ff --no-commit upstream/<target-branch>
```

Complete this step when the merge is ready to commit or Git has produced the full set of conflicts.

### 3. Resolve every conflict semantically

List the unmerged paths with `git diff --name-only --diff-filter=U`. For every path:

1. Inspect the base, source, and target versions with the index stages (`:1:`, `:2:`, and `:3:`) when present.
2. Trace the relevant commits or call sites when intent is not clear from the hunk.
3. Preserve both compatible intents. When they are incompatible, choose the behavior required by the MR while retaining newer target-branch contracts and explain the trade-off.
4. Stage the resolved path only after checking the complete file.

Before committing, require all of these conditions:

- `git diff --name-only --diff-filter=U` returns no paths;
- no conflict markers remain in the paths that conflicted;
- `git diff --check` reports no conflict-introduced whitespace errors;
- the staged diff contains only the merge resolution and expected merge changes;
- any focused validation required by the user or applicable repository instructions succeeds.

### 4. Commit and push to origin

Finish the merge with the repository's merge message, record the resulting commit SHA, and verify the worktree state:

```bash
git commit --no-edit
git status -sb
git rev-parse HEAD
```

Push the local HEAD to the exact MR source branch without force:

```bash
git push origin HEAD:refs/heads/<source-branch>
```

If the push is rejected, stop and report the rejection. Do not reroute the push or rewrite history.

Complete this step only when `git ls-remote --heads origin refs/heads/<source-branch>` reports the same SHA as local HEAD.

### 5. Confirm the MR update

Re-read the MR through available provider tooling and confirm that its source SHA now matches the pushed SHA. Report its current conflict or mergeability status when the provider exposes it. A push to the same source branch updates the existing MR automatically; it does not require creating or editing an MR.

If provider tooling is unavailable, report remote-branch SHA equality as confirmed evidence and state that MR UI status was not independently queried.

## Final report

Return:

- MR URL and verified source/target refs;
- merge commit SHA;
- conflicted files resolved;
- validation performed and result;
- pushed remote ref and verified remote SHA;
- MR source SHA and current conflict/mergeability status, or the exact reason it could not be queried.
