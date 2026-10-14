# Changelog

Historical record of project changes for humans and agents. Enables more informed decisions by recording

- what was previously tried
- why it was tried
- what went according to plan, and
- where assumptions were be updated.

## Usage

Example entries:

**User**
Did x.

**User** (via Claude Code)
I want to achieve y.
**Agent** (Claude Opus 5.5)
Achieved y by doing z.

Agents must provide the user prompt alongside their implementation log.

## 2026-10-03

**User**
Scaffolded the workspace.

**User**
Added the instructions and the rubric.

**User**
Transcribed the three videos.

## 2026-10-04

**User**
Created a project checklist.

## 2026-10-10

**User**
Chose Video 1.

**User**
Did some research and found 6 sources that seemed useful.

## 2026-10-11

**User** (via Codex)
Tackle the next item on the checklist. For each essay source, summarise the contents and extract the key findings. Use language appropriate for a first-year university class.
**Agent** (GPT-6 Astra)
Completed the evidence-list checklist item in `essay/evidence.md`. Summarised all six source PDFs in first-year language, including methods, sample sizes, key findings, limitations, source links and page locators, and relevance to Video 1. Distinguished deliberate suppression from proposed automatic repression, and study results from interpretations. Read image-only pages of Williams (1994) and incorporated its appended correction. Added an evidence map and identified that these sources do not directly test the video's treatment-outcome claim. Marked the evidence-list item complete; source PDFs and course materials were not changed.

**User**
Proofread the evidence list.

## 2026-10-14

**User**
Wrote the essay draft.

**User**
Finalised the draft.

**User** (via Codex)
our code is ugly. do a full refactor of all files to make them human-readable
it's alright to change behaviour details as you see fit. behaviour is a proxy for intent
**Agent** (GPT-6)
Refactored shared tooling into a small CLI entry point plus discovery, document transformation, build execution, and presentation modules. Introduced named immutable Document, BuildResult, and BuildOutcome types. Removed duplicate frontmatter parsing, side effects hidden in filtering, and recursive section-state processing. Markdown section formatting now maps independent sections; file discovery resolves real paths, and compilation and metadata helpers use clearer names. Word counts now separate list items correctly. Kept Clack selection, batch error reporting, flat PDF outputs, date defaults/false handling, and safe publication. Verified lint, type checking, formatting, compilation, metadata/template/word-count/reference regressions, and a 2,000-paragraph document.

**User** (via Codex)
install matt pocock's improve codebase architecture skill
continue
**Agent** (GPT-6)
Used the system skill-installer to install improve-codebase-architecture from mattpocock/skills at skills/engineering/improve-codebase-architecture into the user's Codex skills directory. The skill is available from the next turn.

**User** (via Codex)
references can be included in word count if it's simpler
proceed
**Agent** (GPT-6)
Deepened the document module by moving rendering and word-count implementation behind prepareDocument, deleting the separate Markdown and word-count modules, and removing all reference-section markers, detection, page breaks, and hanging indents. References now receive ordinary formatting and are included in the reported total; frontmatter remains excluded. Added document-interface regression tests for plain/formatted reference headings, counting, list separation, metadata, and unsupported content. Added domain glossary definitions and a brief root README count note. All four tests, lint, type checking, and PDF compilation passed. The current total is 1,117 words including references. Enabled emergency line stretch to prevent a long reference line overflowing and inspected the rendered reference page.

**User** (via Codex)
merge
nvm the latter
**Agent** (GPT-6)
Consolidated the complete CLI flow and per-document build logic into scripts/build.ts, removing lib/build.ts and lib/cli.ts. Kept selection, structured build outcomes, word-count reporting, collision validation, and batch failures. Fixed a name collision exposed by the merge. All four document tests, lint, type checking, and PDF compilation passed.
