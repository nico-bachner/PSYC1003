# PSYC1003 — Method or Madness? The Science of Psychology

Course materials and coursework.

```text
PSYC1003/
├── critique/    # Research essay
├── course/      # Weekly materials
├── scripts/     # Shared essay builder and LaTeX template
└── generated/   # Build output (gitignored)
```

## Build

Requires Bun 1.4.3+, Tectonic, and Times New Roman.

```sh
bun install
bun run build critique
```

The builder accepts an assignment folder or an essay folder, looking for `essay.md` directly or under `essay/`. This writes `generated/critique/essay/essay.pdf`.
