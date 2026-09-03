# docs/ — the document templates the CORPORATE shelf eats

**Verbatim copies. Nothing here was written or transformed by a bot.**

Source: `_bench-for-totois/tiptap/tiptap-templates*.js` — Sum's prose, written for the tiptap
writer card and parked with it on 2026-08-29. Each file sets `window.TIPTAP_TEMPLATES`, and the
first file's own header explains why they drop in clean: *"content is StarterKit-safe HTML
(h1/h2/h3 · p · ul/li · b/i · hr)."*

## why they moved here

`parts/00-deck.js:170` has had `corporateTemplates()` the whole time — it reads
`window.TIPTAP_TEMPLATES` **at click time**, wraps each in `wrapDoc()` (print-ready HTML), and
hands the deck a file. The shelf was never unbuilt. It said COMING SOON because parking the
tiptap card took the global with it, and the reader was left pointing at nothing.

So this is a data move, not a feature. **The picker's own mechanism does the work.**

## ⚠ ORDER MATTERS

`tiptap-templates.js` ASSIGNS the array; the book and novella files CONCAT onto it. Load the base
first or they land on `undefined`. `shell/lazy.js` lists them in the right order inside the
`monaco` bundle — do not sort that list.

## ⚠ this folder is now the HOME

The bench copies are parked prose and stay where they are (corrections attach, they do not get
deleted). But the app reads THESE. If a template's text is ever edited, edit it here — the bench
copy is a fossil from the day the writer was parked, and it will drift.

## what is in them

| file | templates |
|---|---|
| `tiptap-templates.js` | résumé · cover letter · memo · business plan |
| `tiptap-templates-book.js` | A Meditation on Meditation · A Brief History of Nothing |
| `tiptap-templates-novella.js` | Trashy Novella (`dinner`) |
