# language-learner

A browser app for learning Chinese Mandarin.

## Status

A working spaced-repetition drill for the 294 words of HSK 3.0 Level 1. Cards
show a simplified word; revealing gives tone-marked pinyin and English
meanings. Progress is stored in the browser and can be exported to JSON.

## Commands

- `npm run dev` — run the app
- `npm test` — unit tests
- `npm run test:e2e` — end-to-end tests
- `npm run check` — typecheck
- `npm run build:deck` — regenerate the deck from the pinned dataset

Vocabulary data comes from
[drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) (MIT).

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
