---
description: Clean up after a merge — delete the branch, remove the worktree
argument-hint: "[branch]"
allowed-tools: Bash(vibe:*), Bash(git:*), Bash(gh:*)
---

!`vibe wt ls 2>&1 | head -20`

Run `vibe land $ARGUMENTS`. It refuses unless the branch is genuinely merged
(it asks GitHub, so squash-merges are handled correctly).

Then run `vibe wt clean` and tell me whether any other worktrees have also
landed and can go. Do not remove anything that still holds unpushed commits.
