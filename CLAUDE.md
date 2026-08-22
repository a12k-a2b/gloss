# Operating rules

This repo is the toolkit that runs the workflow. `vibe install` copies the
relevant parts of it into any other repo, and this file goes with them.

## The one invariant

**One agent, one worktree, one branch, one port.**

Everything else follows from that. Two agents in one working tree overwrite each
other's edits; two agents on one port fight over a dev server; two agents on one
branch produce a history nobody can review.

```
vibe wt new <slug> --task "<what you are doing>"   # claim a workspace
cd "$(vibe wt path <slug>)" && source .vibe/env    # take its port
...work...
vibe ship -m "<message>"                            # commit, push, draft PR
vibe land <branch>                                  # after it merges: clean up
```

## Rules

1. **Never commit to the default branch.** A hook blocks it. Create a worktree.
2. **Never use a default port.** `source .vibe/env` and use `$VIBE_PORT`.
   Hard-coded 3000/5173/8080 is the most common collision between parallel agents.
3. **Never touch another worktree.** If you need something from one, ask; do not
   read or edit across trees. `git worktree list` shows who else is live.
4. **One PR does one thing.** If a task grows a second concern, write the second
   concern down and leave it. A 200-line PR gets reviewed; a 2000-line PR gets
   rubber-stamped, which is the same as not being reviewed.
5. **Never end a session with stranded work.** Uncommitted, unpushed, or
   PR-less work is invisible and will be forgotten. A hook will stop you; the fix
   is `vibe ship`, not `--no-verify`.
6. **Never force-push a branch with an open PR.** It destroys the reviewer's
   diff. Merge the base in instead; `--force-with-lease` on your own unreviewed
   branch is fine.
7. **Never skip, delete, or `.only` a test to get green.** If a test is wrong,
   fix the test and say why in the commit. A quarantined test is a bug with a
   longer fuse.
8. **Verify before you use.** Every API, flag, config key and package you did
   not read in this repo, check it exists. Invented dependencies are how AI code
   fails in production and how supply-chain attacks land.

## Before opening a PR

Run the same pass a reviewer would, on your own diff:

- Is every new code path reachable? Delete what is not.
- Is any error swallowed by an empty `catch` / `except: pass` / `|| true`?
- Does any test assert on a value the test itself computed?
- Did anything the task asked for get quietly dropped?
- Is there a secret, a token, or an absolute local path in the diff?
- Did unrelated reformatting sneak in?

`/ship` runs this checklist for you.

## Commands

| | |
| --- | --- |
| `vibe repos --clone --fix-refspec` | get every repo here, tracking every branch |
| `vibe scan` | local branch inventory; no token, sees unpushed and uncommitted work |
| `vibe rollout --apply` | install across every repo, one branch and draft PR each |
| `vibe fleet` | every open PR, orphan branch and deletable branch, all repos |
| `vibe triage` | the five things that need you, worst first |
| `vibe wt new/ls/clean` | worktree lifecycle |
| `vibe spawn -t "..." -t "..."` | one isolated agent per task, under a WIP limit |
| `vibe ship` / `vibe land` | commit-push-PR / post-merge cleanup |
| `vibe landed <branch>` | has it actually landed? (sees squash-merges) |
| `vibe doctor` | is this repo wired up correctly |
| `vibe install` | put the CI, review and hook config into another repo |

Slash commands: `/fleet` `/triage` `/ship` `/land` `/wt` `/spawn`.
Subagents: `pr-reviewer` (review a diff), `integrator` (land parallel branches).

## What runs automatically

You do not need to be told to do these; hooks do them.

| When | What happens |
| --- | --- |
| Session start | Branch, worktree, port, assigned task and other live agents are put in context |
| Before a Bash call | Force-push to a shared branch, commits to the default branch, destructive resets, and deleting another agent's worktree are refused |
| Before a write | Files containing real credentials are refused |
| After an edit | The file is formatted, and fast lint errors come straight back to you |
| Session end | Uncommitted, unpushed or PR-less work stops the session until it is shipped |

Escape hatches, for when a rule is genuinely wrong: `VIBE_ALLOW_DEFAULT_COMMIT=1`,
`VIBE_ALLOW_DISCARD=1`, `VIBE_SKIP_STOP_GUARD=1`. Use them deliberately, not
reflexively.

## Repo layout

```
bin/vibe            CLI entrypoint (dispatcher)
bin/vibe-fleet.py   cross-repo GitHub inventory + scoring + renderers
bin/vibe-scan       local git-only inventory; no token, sees unpushed work
bin/vibe-repos      clone every repo, widen narrow fetch refspecs
bin/vibe-rollout    apply across repos, one branch and draft PR each
bin/vibe-spawn      parallel agent launcher with a WIP limit
bin/vibe-install    copies templates into a repo, respecting its stated rules
lib/common.sh       shared shell helpers, incl. squash-aware branch_landed()
hooks/              the automation described above (+ hooks.json for the plugin)
commands/           slash commands
agents/             subagents
skills/             skills
templates/          what gets installed into other repos
workers/            Cloudflare Worker for the always-on fleet dashboard
docs/               playbook, decisions, research
tests/              offline tests
```

These live at the repo root rather than under `.claude/` because this repo is
also a Claude Code plugin, and a plugin discovers its components from those
names. `.claude/settings.json` wires the same hooks for this repo directly.

## House style

Shell targets bash 3.2 (macOS ships it): no associative arrays, no `${x^^}`.
Python is stdlib-only so the tools run anywhere `python3` does. Hooks fail open —
a broken hook must never wedge a session.
