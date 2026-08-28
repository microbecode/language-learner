# language-learner

A browser app for learning Chinese Mandarin.

## Status

Early. The repository holds project setup only — no application code yet.

## Setup

This repo authenticates to GitHub through [direnv](https://direnv.net). Create
`.envrc` at the repo root with a fine-grained personal access token:

```sh
export GH_TOKEN=github_pat_...
```

Then restrict it and load it:

```sh
chmod 600 .envrc
direnv allow
```

`.envrc` is gitignored. Confirm the token is live with `gh api user`.

The token is the only GitHub credential here. `origin` is an HTTPS remote and
SSH-form URLs are rewritten to HTTPS, so fetch and push go through the token
rather than an SSH key.
