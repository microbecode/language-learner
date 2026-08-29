# language-learner

A browser app for learning Chinese Mandarin.

## Status

A working spaced-repetition drill for HSK 3.0 Level 1: its 294 words, plus the
111 characters those words are built from that the list never teaches on its
own — 405 cards in all.

Cards show a simplified word; revealing gives tone-marked pinyin and meanings.
A compound also shows the characters it is built from and the other words
sharing them; a single character shows the compounds it appears in.

Cards are taught simplest first — single characters before compounds, ordered
by stroke count, with ties going to the character that unlocks more words.
Progress is stored in the browser and can be exported to JSON.

## Commands

- `npm run dev` — run the app
- `npm test` — unit tests
- `npm run test:e2e` — end-to-end tests
- `npm run check` — typecheck
- `npm run build:deck` — regenerate the deck from the pinned dataset

## Data

- Vocabulary: [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) (MIT).
- Character readings, definitions and stroke counts: the
  [Unihan Database](https://www.unicode.org/charts/unihan.html), © Unicode, Inc.,
  used under the [Unicode License](https://www.unicode.org/license.txt).

`npm run build:deck` regenerates the deck from both. It needs `unzip` on PATH,
since Unihan is distributed only as a zip archive.

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
