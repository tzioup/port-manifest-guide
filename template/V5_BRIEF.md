# V5 Receiving Brief — Consuming a Port Manifest

## Definition of success

You are done when:
1. Every manifest intent has a disposition: PORTED, SKIPPED (with reason), or DEFERRED (with gate question for the user).
2. Every ported artifact lives in a V5 directory that V5's retrieval tools actually search.
3. No V4 observational data (relationship memories, algorithm reflections, session logs) has been copied into V5's active learning paths.
4. Every ported file has V5-compliant frontmatter where applicable.
5. The ISA documents every decision, every skip, and every rollback point.

## Before you touch any V4 content

**Map your own retrieval architecture first.** The manifest describes V4. You need to know V5.

1. Which files does V5 load at startup? (Check CLAUDE.md `@` imports and any summary generators.)
2. Which tools search which directories? (Read MemoryRetriever.ts, KnowledgeHarvester.ts, KnowledgeGraph.ts — what paths do they index?)
3. Which hooks auto-generate content? (RelationshipMemory, algorithm reflections, session logs — V5 builds these natively.)

You cannot route V4 content correctly without this map. File-name matching between V4 and V5 is wrong — the taxonomies are different.

## Stock vs. flow classification

Before triaging any manifest intent, classify its content:

**Stock** — accumulated observations V5 regenerates through its own hooks. Examples: relationship memory entries, algorithm reflections, learning signals, session logs, satisfaction ratings, failure captures. These are calibrated for V4's hooks, schema, and behavior. Porting them contaminates V5's developing model.

**Flow** — one-time work product V5 cannot recreate. Examples: research investigations, curated discoveries, project documentation, build logs, knowledge notes, creative output. These represent real intellectual work that happened once.

**The rule:** Port flow. Leave stock. If V5 has a hook that generates equivalent content, the V4 version is stock regardless of how valuable it feels.

**The systems argument:** V5 has a native learning flywheel: sessions → observations → model accuracy → effectiveness → more sessions. Early in V5's life, this flywheel is fragile. Bulk-porting V4 observations floods the observation pool with content calibrated for a different system. V5's own signal gets drowned out. The V4 observations become the dominant model — and they're wrong for V5.

## Same-taxonomy trap

If V4 and V5 share a taxonomy (e.g., both have TELOS files with similar names), do NOT use classification-based migration tools. They try to reclassify already-correct content and produce low confidence with misrouting.

**Use direct diff-and-merge instead:** Read the V4 file. Read the V5 file. Identify what V5 is missing. Merge the delta with user approval. The content is already categorized — it needs depth-merging, not reclassification.

## Routing rules

### TELOS / identity content

V4 and V5 TELOS architectures differ (V4: ~7 files, V5: 22+). One V4 file may split across multiple V5 files. Route by V5's retrieval paths, not by V4's filename.

**Two-tier file pattern:** V5 files loaded at startup must stay concise. V4 depth goes below a `## Deep Context` heading — quick scan at top, full depth on demand, both in one file.

### Knowledge content (discoveries, decisions, research)

**Cluster, don't scatter.** If triaging closeout artifacts (decisions, discoveries), group KEEP entries by theme into ~5-10 clustered knowledge notes rather than writing one file per entry. Reasons:
- BM25 search retrieves one well-tagged file better than many tiny files with weak individual matches
- Seedling expiry (90-day) garbage-collects unreferenced stubs; clustered `status: evergreen` notes survive
- Frontmatter tags handle cross-cutting queries

Each clustered note needs V5 frontmatter:
```yaml
---
title: "Descriptive Title"
type: idea|research|person|company
status: seedling|budding|evergreen
tags: [relevant, tags, for, retrieval]
valid_from: "YYYY-MM-DD"
related: [other-note-slugs]
---
```

### Research archives

Port whole directory trees for complete investigations. Add a README.md index at the root with frontmatter. These are flow — irreplaceable intellectual work.

### Large local corpora

Check `du -sh` before committing. Anything over ~50MB needs a git strategy decision:
- **Gitignore** — local-only, not version-controlled, works for search
- **Git LFS** — tracked but stored separately
- **Commit anyway** — private repo, disk is cheap, push/clone gets slow

Ask the user. The manifest doesn't flag file sizes.

### Conventions and routing rules

V4 artifacts with a CONVENTION.md or similar routing file are **capabilities, not just data**. Porting the data file is mechanical. Recreating the routing convention is a design task. Flag these for the user rather than silently copying the data and ignoring the convention.

### Project state

If V4 has many active projects, don't bulk-integrate into the V5 projects spine. Add a pointer to the V4 project archive and leave files in situ. The user knows which ones are active.

## Triage process

For each manifest intent:

1. **Read `port_notes` and `content_nature`.** Understand what V4 had.
2. **Classify stock vs. flow.** If V5 has a hook that generates equivalent content, it's stock. Skip it.
3. **For flow items, determine V5 destination** by checking which V5 retrieval tool would need to find it.
4. **Check file sizes** before committing large archives.
5. **Port with provenance.** Add V5 frontmatter. Commit individually with descriptive messages. Record rollback points in the ISA.

## Wave structure

Organize porting into waves by risk:

| Wave | Content | Risk | Approach |
|------|---------|------|----------|
| 1 | Identity, TELOS, voice | Low — enriches existing files | Diff-and-merge, two-tier pattern, per-file commits |
| 2 | Knowledge, research, archives | Medium — new files in retrieval path | Stock/flow triage first, cluster knowledge notes, git strategy for large files |
| 3 | Capabilities (V4-unique skills, hooks, agents) | High — architectural decisions | Assess each against V5 native capabilities, RECREATE over PORT where architectures differ |

Gate between waves. Don't proceed to Wave 2 until Wave 1 is verified and the user is satisfied.

## ISA as coordination document

Use a single ISA at `MEMORY/WORK/{slug}/ISA.md` for the entire migration. It tracks:
- Per-item status (DONE, PENDING, SKIP) with commit hashes
- Rollback commands per item (`git revert <hash>`)
- Decisions with rationale
- Wave progress totals

Multiple sessions (including parallel sessions on non-overlapping files) read and update this ISA. It's the single source of truth for migration state.

## Parallel session safety

Two sessions can work the migration simultaneously if:
- File targets don't overlap (e.g., one does TELOS, one does voice/identity)
- Both read/update the shared ISA
- Neither touches files the other is actively editing

Provide prompt templates for parallel sessions that specify which files are in-scope and which are off-limits.

## Gotchas from a real migration

- **V5's default bias is to DROP V4 capabilities.** When assessing V4-unique skills/hooks/agents against V5 equivalents, the receiving instance will compare frontmatter and names, conclude "V5 already has this," and recommend DROP. This is wrong ~80% of the time. Force deep cross-comparison: spawn agents to read the FULL content of both V4 and V5 versions side by side. On one real migration this changed the picture from 80% DROP to 10% DROP — V4 capabilities had depth, methodology, and features that V5's similarly-named equivalents didn't cover. Surface comparison is not comparison.
- **MigrateScan fails on same-taxonomy content.** 13% avg confidence, systematic misrouting. Use diff-and-merge.
- **"File exists" masks content gaps.** V5 may already have a CHALLENGES.md — but at 10% of V4's depth. Compare by content, not by file presence.
- **V4's TELOS architecture ≠ V5's.** Don't assume filenames map. Route by V5 retrieval paths.
- **Relationship memories look valuable but are stock.** V5's RelationshipMemory hook generates these natively.
- **Build logs are capabilities, not data.** The CONVENTION.md behind them needs design work.
- **Manifest counts are stale.** Always `find` and count at port time.
- **~1-2% of a mature V4 archive belongs in V5's active retrieval path.** The rest is stock, stale, or historical. This is correct, not a failure. The V4 backup remains accessible.
