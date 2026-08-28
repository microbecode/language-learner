# language-learner

A browser app for learning Chinese Mandarin.

## Repo state

No application code yet. The stack — framework, package manager, directory
layout — is undecided, and gets settled in a design pass before any scaffolding
lands.

## Local setup

GitHub authentication comes from direnv, not from `gh auth login`:

- `.envrc` (gitignored, mode 600) exports `GH_TOKEN`, a fine-grained PAT for the
  `microbecode` account.
- Run `direnv allow` after editing `.envrc`.
- `~/.gitconfig` routes GitHub credentials through `gh auth git-credential`, and
  `~/.config/gh/hosts.yml` is empty — so `GH_TOKEN` is the only credential
  source for the `gh` CLI and the GitHub API. In a shell where direnv has not
  loaded, `gh` fails. Check with `gh api user`, which prints `microbecode`.
- `origin` is `https://github.com/microbecode/language-learner.git` over HTTPS.
  All GitHub access — fetch, push, `gh`, API — authenticates with `GH_TOKEN`.
  SSH keys are not used: a local `url.https://github.com/.insteadOf
  git@github.com:` rewrite turns any SSH-form GitHub URL into HTTPS, so a
  copied `git@github.com:` clone or remote still goes through the token.

## Git

All work happens on `master`. No feature branches, no worktrees, no pull
requests — commit straight to `master`.

Commits are attributed to `microbecode` /
`20242241+microbecode@users.noreply.github.com`, set in this repo's local
config so it holds regardless of the global identity.

Nothing is committed automatically.

## MCP servers

`.mcp.json` declares two servers:

- **context7** — live library and framework documentation. Use it instead of
  quoting API surfaces from memory.
- **playwright** — drives a real browser. Visual and behavioral changes are
  verified here, not asserted.

## Local-only working files

Gitignored, and they stay that way:

- `superpowers/specs/` and `superpowers/plans/` — design and planning artifacts
  from the brainstorming and writing-plans skills. They record how alignment was
  reached; the code and commit messages carry what shipped.
- `BRANCH-NOTES.md` — one screen of branch continuity notes, so a new session
  skips re-discovery.
