# Review instructions

Rules that change how this PR is reviewed. Kept short on purpose: length
dilutes the rules that matter, and general project context belongs in CLAUDE.md.

Do not use `@file` imports here — they are not expanded, and the reviewer
receives the literal text.

## What to weight heavily

This code is mostly written by language models. It will compile, read fluently,
and look idiomatic. The defects are not stylistic, so do not spend the review
on style.

1. **Invented surface area.** APIs, methods, config keys, CLI flags, and
   packages that do not exist. Verify against the actual dependency rather than
   plausibility. Every imported package must appear in the manifest.
2. **Swallowed failure.** Empty `catch {}` / `except: pass`, ignored return
   values, un-awaited promises, `|| true` covering a real failure.
3. **Tests that cannot fail.** Assertions on values the test computed itself,
   mocks that stub the thing under test, `skip`/`only` left in, tests deleted
   rather than fixed.
4. **Dropped requirements.** Compare the diff against the PR description. Work
   that was silently narrowed leaves no trace in the diff, so it is the easiest
   defect to miss and the most expensive to ship.
5. **Security at trust boundaries.** String-built queries or shell commands,
   unvalidated external input, secrets in code, over-broad tokens.

## What to weight lightly

- Naming, formatting, and import order. A formatter runs on every edit.
- Suggestions to add abstraction for a single caller.
- Documentation for internal helpers in an experiment repo.

## Rules of engagement

- Cap nit-level comments at three. Beyond that, summarise in one comment.
- Do not request changes. Report findings and let the author decide — a bot
  blocking a solo developer's own merge is friction, not safety.
- Skip draft pull requests entirely.
- Every finding must name a concrete failure: the input, the state, and what
  goes wrong. A finding that cannot be stated that way is a preference, not a
  defect, and should be left out.
