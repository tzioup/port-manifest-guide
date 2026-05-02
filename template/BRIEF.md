# Port Manifest — Session Brief

## Definition of success

You are done when:
1. Every artifact in the V4 installation has a fate: a manifest entry, an explicit anti-port decision, or is folded into another entry. Nothing is unaccounted.
2. Every `v4_path` in the manifest points to a file or directory that actually exists on disk.
3. The manifest describes V4 as it is — no V5 destinations, no prescriptions about where things should go in V5.
4. The validator passes with 0 errors.
5. A human can review the generated markdown routing table and spot any gaps you missed.

## Companion files in this directory

- `validate-manifest.ts` — Bun/TypeScript validator. Customize `VALID_CATEGORIES` and V5 regex at the top. Run with `bun validate-manifest.ts PORT_MANIFEST.jsonl`.
- `PORT_MANIFEST.jsonl` — Seed file with one example entry showing all 23 fields. Replace with real entries.

---

## What you're building

A JSONL catalog of every artifact in this V4 installation, organized by intent (purpose) not file path. V5 will consume this to find and port artifacts. The manifest describes V4 — it does NOT prescribe V5 destinations.

## Critical constraints

1. **v5_destination must be null on every entry.** V5 decides where things go. The manifest describes V4 only.
2. **All v4_paths must use relative paths** from the V4 backup root (e.g. `hooks/lib/btt.ts` not `~/.claude/hooks/lib/btt.ts`). By the time V5 ports, it will own `~/.claude/` and V4 will be backed up elsewhere (e.g. `~/.claude.v4-backup/`). Paths outside the repo root (`~/work/`, `~/portal/`, `~/Projects/`, `~/.config/`) use `~` prefix since those don't move.
3. **port_notes describe V4 role only**, minimum 80 characters, written for someone who knows V5 but has never seen V4.
4. **Every V4 artifact must have a fate**: manifest entry, anti-port (with reason), or folded into another entry.

## Schema (23 required fields per entry)

```json
{
  "intent": "kebab-case-identifier",
  "category": "core-identity|algorithm|hooks|skills|agents|memory|tools|projects|portal|infrastructure|knowledge|learning|relationships",
  "display_name": "Human-Readable Name",
  "summary": "One-line description",
  "status": "pending|in-progress|ported|skipped|gated",
  "status_updated": "YYYY-MM-DD",
  "priority": "P0|P1|P2|P3",
  "effort": "5min|30min|2hr|4hr+",
  "v4_paths": ["relative/path/to/file", "relative/path/to/dir/"],
  "v4_role": "What this does in V4 (longer description)",
  "v4_format": "File type and structure description",
  "content_nature": "identity|configuration|data|code|documentation|research|creative",
  "portability": "portable|adaptable|v4-native",
  "v5_destination": null,
  "v5_slot_exists": null,
  "depends_on": ["other-intent"],
  "blocks": ["other-intent"],
  "related_indexes": ["grep command to find related data"],
  "port_notes": "V4 role description for V5 consumer (>=80 chars, NO V5 prescriptions)",
  "debt_assessment": "clean|refactor|debt|drop — explanation",
  "gate": "Question to answer (if gated) or null",
  "skip_reason": "Why skipped (if skipped) or null",
  "ported_by_session": null
}
```

## The 2-pass process

### Pass 1: Audit and Draft

**Step 1 — Walk the filesystem.** Run `find` and `du` across the entire installation. Count hooks, skills, agents, memory subdirs, portal pages, project dirs, cron jobs, systemd services. Check `~/work/`, `~/Projects/`, `~/portal/`. Walk the repo root directory explicitly (orphan files there are the most commonly missed). Do NOT trust existing JSONL indexes or session logs — they go stale fast.

**Step 2 — Build an intent list.** Before writing JSONL, write a markdown table: one row per planned entry with intent name, category, status, and source. Every artifact must appear as an entry, an anti-port, or folded into another entry. Split aggressively — splitting later is expensive.

**Step 3 — Write the JSONL.** One JSON object per line. Use `JSON.stringify()` (write a TypeScript generator script, don't hand-write JSON). Group by intent not by path. Target 85-150 entries for a mature installation.

**Step 4 — Run the validator.** Use the provided `validate-manifest.ts`. It checks schema, enums, null v5_destination, port_notes length, V5 prescription regex, path existence on disk, dependency references, cycle detection, duplicate intents, entry count range. A schema-valid draft is NOT necessarily correct — proceed to Pass 2.

### Pass 2: Verify and Harden

**Step 5 — Verify paths.** `stat` every path in every `v4_paths` array. This is the single highest-value check. Phantom paths (files that were moved or deleted) are the #1 data quality issue.

**Step 6 — Check coverage gaps.** Compare intent list against filesystem walk. Did any directory slip through without an entry or anti-port? Check root-level items specifically. Verify counts in port_notes against actual `find` output.

**Step 7 — Check structural integrity.** Dependency cycles (DFS). Bidirectional consistency (A blocks B → B depends_on A). Orphan entries with no edges (expected for projects, suspicious for infrastructure). Overlapping v4_paths between entries.

**Step 8 — Generate the routing table.** Generate `PORT_MANIFEST.md` from the JSONL (don't maintain separately). Must include: Scope Declaration (what manifest covers and doesn't), category tables, gated items with questions, anti-port list with reasons, cross-environment artifacts (cloud/host-machine/external services), data-flow chains (pipelines crossing multiple entries), credentials list (files needing manual transfer).

## Gotchas from real usage

- **Indexes lie.** 10-50% count discrepancies vs actual filesystem. Always verify with `find`.
- **Phantom paths survive schema validation.** Without `stat` checking, moved/deleted files pass forever.
- **Prose escapes the validator.** The markdown routing table (data-flow chains, cross-env lists) is free text — phantom paths can sneak into prose.
- **Root-level orphans.** One-off scripts and repos at the repo root get missed because no audit pattern looks there.
- **0 validator errors ≠ correct.** Validator checks structure, not completeness. A manifest with 0 errors and 40% gaps passes fine.

## Honest limitations of the finished manifest

- **Filesystem-only.** Cloud databases, host-machine configs, SaaS state are invisible to `find`. Cross-env section documents known artifacts but can't discover unknown ones.
- **~30% dependency coverage.** `depends_on`/`blocks` captures port ordering. Can't represent data-flow chains, runtime ordering, import graphs, or temporal sequencing.
- **No completeness detection.** The validator can't know what's missing.
- **Staleness.** Numeric claims in port_notes drift within a week. V5 should verify counts at port time.
- **Catalog, not architecture map.** Can't represent feedback loops. `depends_on` is acyclic.

## What V5 does with this

V5 queries the JSONL by intent, reads port_notes to understand V4's role, then self-places the artifact in V5's own architecture. The manifest is an input, not a prescription. V5 should `stat` paths and verify counts at port time — the manifest may be stale.

## Diff shortcut (if available)

Your V4 instance is a git repo. Check `git log --oneline --reverse | head -1` for the initial post-install commit — that's your stock baseline. If it exists, `git diff --stat <commit> HEAD` shows what you customized vs stock.

The diff only catches modifications to stock files. User-generated content (MEMORY, projects, portal, scripts, plugins, infrastructure) has no stock counterpart and is invisible to any diff — and on a mature instance, user-generated content is the majority of what needs porting. Use the diff to seed Pass 1 discovery for customizations to stock files (Algorithm blocks, hook overrides, agent tweaks); the manifest process handles everything else.
