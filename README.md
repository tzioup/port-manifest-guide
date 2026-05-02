# Port Manifest Guide

**A methodology for cataloging V4 PAI artifacts so V5 can find and port them.**

A Port Manifest catalogs every artifact in your V4 PAI installation so V5 can find and port them. Your PAI builds it in two passes: audit the filesystem, then verify the draft against reality. A `git diff` against your stock baseline only catches modifications to stock files — user-generated content (memory, projects, portal, infrastructure) has no stock counterpart and is invisible to any diff. The manifest process covers both. The manifest is an input to V5 — V5 decides where things go.

## Quick Start

**Point your PAI at [`template/BRIEF.md`](template/BRIEF.md)** — the token-optimized session brief. It contains the full schema, 2-pass process, constraints, and gotchas in a format designed for LLM consumption.

The starter kit includes:

| File | What |
|------|------|
| [`template/BRIEF.md`](template/BRIEF.md) | LLM-optimized session brief — paste into a fresh PAI session |
| [`template/validate-manifest.ts`](template/validate-manifest.ts) | Validator (Bun/TypeScript) — schema, path existence, cycles, V5 prescription regex |
| [`template/PORT_MANIFEST.jsonl`](template/PORT_MANIFEST.jsonl) | Seed file with example entry showing all 23 fields |

## Human-Readable Guide

The full methodology with principles, gotchas, and the diff-vs-manifest analysis is at:

**[tzioup.github.io/port-manifest-guide](https://tzioup.github.io/port-manifest-guide/)**

Read it to understand what your PAI is doing — so you can spot gaps in the output.
