# Port Manifest Guide

**A complete methodology for V4→V5 PAI migration — both sides of the handoff.**

The guide covers two stages: **building** a Port Manifest (V4's job — catalog every artifact by intent) and **consuming** it (V5's job — triage, route, and port). Both stages have LLM-optimized prompt templates your PAI can consume directly.

## Quick Start

**V4 (building the manifest):** Point your V4 PAI at [`template/BRIEF.md`](template/BRIEF.md)

**V5 (consuming the manifest):** Point your V5 PAI at [`template/V5_BRIEF.md`](template/V5_BRIEF.md)

The starter kit includes:

| File | What |
|------|------|
| [`template/BRIEF.md`](template/BRIEF.md) | V4 session brief — builds the manifest (schema, 2-pass process, constraints) |
| [`template/V5_BRIEF.md`](template/V5_BRIEF.md) | V5 receiving brief — consumes the manifest (stock/flow triage, routing rules, wave structure) |
| [`template/validate-manifest.ts`](template/validate-manifest.ts) | Validator (Bun/TypeScript) — schema, path existence, cycles, V5 prescription regex |
| [`template/PORT_MANIFEST.jsonl`](template/PORT_MANIFEST.jsonl) | Seed file with example entry showing all 23 fields |

## Human-Readable Guide

The full methodology with principles, gotchas, and the diff-vs-manifest analysis is at:

**[tzioup.github.io/port-manifest-guide](https://tzioup.github.io/port-manifest-guide/)**

Read it to understand what your PAI is doing — so you can spot gaps in the output.
