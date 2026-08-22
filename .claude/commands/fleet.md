---
description: Show every piece of in-flight and rotting work across all your repos
argument-hint: "[--deep] [--match <substring>]"
allowed-tools: Bash(vibe:*), Bash(git:*), Read
---

Current fleet state:

!`vibe fleet $ARGUMENTS 2>&1 | head -80`

Read the report above and give me a short verbal summary, in this order:

1. **Blocked** — PRs with failing CI or merge conflicts. Name them and say what
   is wrong, not just that something is wrong.
2. **Forgotten** — branches carrying unmerged work with no PR. For each, say
   whether it looks worth finishing or worth deleting, based on its age and size.
3. **Free wins** — branches already merged that can be deleted right now.

Then propose one concrete next action and stop. Do not start work without me.
