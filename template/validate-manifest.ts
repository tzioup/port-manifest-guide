#!/usr/bin/env bun
/**
 * Port Manifest Validator (V3)
 *
 * Usage: bun validate-manifest.ts [path/to/PORT_MANIFEST.jsonl] [--skip-path-check]
 *
 * Run from the V4 backup root so relative v4_paths resolve correctly.
 * Customize VALID_CATEGORIES, V5_FILE_NAMES, and V5_PRESCRIPTION for your installation.
 */

import { existsSync } from "fs";

// --- CUSTOMIZE THESE FOR YOUR INSTALLATION ---

const VALID_CATEGORIES = new Set([
  "core-identity", "algorithm", "hooks", "skills", "agents", "memory",
  "tools", "projects", "portal", "infrastructure", "knowledge", "learning", "relationships"
]);

// V5-specific file names that should NOT appear in port_notes (regex)
// Replace these with your V5's actual naming conventions
const V5_FILE_NAMES = /EXAMPLE_V5_FILE|V5_SPECIFIC_NAME/;

// V5 prescription language that should NOT appear in port_notes (regex)
const V5_PRESCRIPTION = /V5 expects |V5 has [A-Z]|V5 consolidates |V5 may use |V5's [A-Z]|feed V5|into V5|the newer architecture/;

// --- END CUSTOMIZATION ---

const VALID_STATUS = new Set(["pending", "in-progress", "ported", "skipped", "gated"]);
const VALID_PRIORITY = new Set(["P0", "P1", "P2", "P3"]);
const VALID_EFFORT = new Set(["5min", "30min", "2hr", "4hr+"]);
const VALID_CONTENT_NATURE = new Set(["identity", "configuration", "data", "code", "documentation", "research", "creative"]);
const VALID_PORTABILITY = new Set(["portable", "adaptable", "v4-native"]);
const VALID_DEBT_PREFIX = new Set(["clean", "refactor", "debt", "drop"]);

const REQUIRED_FIELDS = [
  "intent", "category", "display_name", "summary", "status", "status_updated",
  "priority", "effort", "v4_paths", "v4_role", "v4_format", "content_nature",
  "portability", "v5_destination", "v5_slot_exists", "depends_on", "blocks",
  "related_indexes", "port_notes", "debt_assessment", "gate", "skip_reason",
  "ported_by_session"
];

const MIN_PORT_NOTES_LENGTH = 80;
const MIN_ENTRIES = 85;
const MAX_ENTRIES = 150;

interface Violation {
  intent: string;
  field: string;
  message: string;
  severity: "error" | "warning";
}

const file = process.argv[2] || "PORT_MANIFEST.jsonl";
const checkPaths = !process.argv.includes("--skip-path-check");
const text = await Bun.file(file).text();
const lines = text.trim().split("\n");

const violations: Violation[] = [];
const intents = new Set<string>();
const allEntries: Record<string, any>[] = [];

for (let i = 0; i < lines.length; i++) {
  let entry: Record<string, any>;
  try {
    entry = JSON.parse(lines[i]);
  } catch {
    violations.push({ intent: `line-${i + 1}`, field: "JSON", message: "Invalid JSON", severity: "error" });
    continue;
  }
  allEntries.push(entry);

  const intent = entry.intent || `line-${i + 1}`;

  if (intents.has(intent)) {
    violations.push({ intent, field: "intent", message: "Duplicate intent", severity: "error" });
  }
  intents.add(intent);

  for (const field of REQUIRED_FIELDS) {
    if (!(field in entry)) {
      violations.push({ intent, field, message: "Missing field", severity: "error" });
    }
  }

  if (!VALID_CATEGORIES.has(entry.category)) {
    violations.push({ intent, field: "category", message: `Invalid: "${entry.category}"`, severity: "error" });
  }
  if (!VALID_STATUS.has(entry.status)) {
    violations.push({ intent, field: "status", message: `Invalid: "${entry.status}"`, severity: "error" });
  }
  if (!VALID_PRIORITY.has(entry.priority)) {
    violations.push({ intent, field: "priority", message: `Invalid: "${entry.priority}"`, severity: "error" });
  }
  if (!VALID_EFFORT.has(entry.effort)) {
    violations.push({ intent, field: "effort", message: `Invalid: "${entry.effort}"`, severity: "error" });
  }
  if (!VALID_CONTENT_NATURE.has(entry.content_nature)) {
    violations.push({ intent, field: "content_nature", message: `Invalid: "${entry.content_nature}"`, severity: "error" });
  }
  if (!VALID_PORTABILITY.has(entry.portability)) {
    violations.push({ intent, field: "portability", message: `Invalid: "${entry.portability}"`, severity: "error" });
  }

  if (entry.debt_assessment === null || entry.debt_assessment === undefined) {
    violations.push({ intent, field: "debt_assessment", message: "Must not be null", severity: "error" });
  } else {
    const prefix = String(entry.debt_assessment).split(" ")[0].replace(/[—–]/g, "").trim();
    if (!VALID_DEBT_PREFIX.has(prefix)) {
      violations.push({ intent, field: "debt_assessment", message: `Must start with clean|refactor|debt|drop, got: "${prefix}"`, severity: "error" });
    }
  }

  if (entry.v5_destination !== null) {
    violations.push({ intent, field: "v5_destination", message: `Must be null, got: "${entry.v5_destination}"`, severity: "error" });
  }
  if (entry.v5_slot_exists !== null) {
    violations.push({ intent, field: "v5_slot_exists", message: `Must be null, got: "${entry.v5_slot_exists}"`, severity: "error" });
  }

  if (entry.status === "skipped" && (!entry.skip_reason || entry.skip_reason.trim() === "")) {
    violations.push({ intent, field: "skip_reason", message: "Required when status is 'skipped'", severity: "error" });
  }
  if (entry.status === "gated" && (!entry.gate || entry.gate.trim() === "")) {
    violations.push({ intent, field: "gate", message: "Required when status is 'gated'", severity: "error" });
  }

  if (entry.port_notes && entry.port_notes.length < MIN_PORT_NOTES_LENGTH) {
    violations.push({ intent, field: "port_notes", message: `Too short (${entry.port_notes.length} chars, min ${MIN_PORT_NOTES_LENGTH})`, severity: "error" });
  }

  if (entry.port_notes && V5_FILE_NAMES.test(entry.port_notes)) {
    const match = entry.port_notes.match(V5_FILE_NAMES);
    violations.push({ intent, field: "port_notes", message: `V5 file name detected: "${match?.[0]}"`, severity: "error" });
  }
  if (entry.port_notes && V5_PRESCRIPTION.test(entry.port_notes)) {
    const match = entry.port_notes.match(V5_PRESCRIPTION);
    violations.push({ intent, field: "port_notes", message: `V5 prescription detected: "${match?.[0]}"`, severity: "error" });
  }

  if (checkPaths && Array.isArray(entry.v4_paths)) {
    for (const p of entry.v4_paths) {
      const resolved = p.replace(/^~/, process.env.HOME || "");
      if (!existsSync(resolved)) {
        violations.push({ intent, field: "v4_paths", message: `Path does not exist: "${p}"`, severity: "error" });
      }
    }
  }
}

// Cross-entry checks
const intentSet = new Set(allEntries.map(e => e.intent));
const intentMap = new Map(allEntries.map(e => [e.intent, e]));

for (const entry of allEntries) {
  if (Array.isArray(entry.depends_on)) {
    for (const dep of entry.depends_on) {
      if (!intentSet.has(dep)) {
        violations.push({ intent: entry.intent, field: "depends_on", message: `References non-existent intent: "${dep}"`, severity: "error" });
      }
    }
  }
  if (Array.isArray(entry.blocks)) {
    for (const dep of entry.blocks) {
      if (!intentSet.has(dep)) {
        violations.push({ intent: entry.intent, field: "blocks", message: `References non-existent intent: "${dep}"`, severity: "error" });
      }
    }
  }

  if (Array.isArray(entry.blocks)) {
    for (const blocked of entry.blocks) {
      const target = intentMap.get(blocked);
      if (target && Array.isArray(target.depends_on) && !target.depends_on.includes(entry.intent)) {
        violations.push({ intent: entry.intent, field: "blocks", message: `Blocks "${blocked}" but "${blocked}" doesn't depend_on "${entry.intent}"`, severity: "warning" });
      }
    }
  }
}

// Cycle detection via DFS
function detectCycles(): string[] {
  const cycles: string[] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push(path.slice(cycleStart).join(" -> ") + " -> " + node);
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    inStack.add(node);
    path.push(node);

    const entry = intentMap.get(node);
    if (entry && Array.isArray(entry.depends_on)) {
      for (const dep of entry.depends_on) {
        if (intentSet.has(dep)) dfs(dep, [...path]);
      }
    }

    inStack.delete(node);
  }

  for (const intent of intentSet) {
    dfs(intent, []);
  }
  return cycles;
}

const cycles = detectCycles();
for (const cycle of cycles) {
  violations.push({ intent: "GLOBAL", field: "dependency_cycle", message: `Cycle detected: ${cycle}`, severity: "error" });
}

if (allEntries.length < MIN_ENTRIES || allEntries.length > MAX_ENTRIES) {
  violations.push({ intent: "GLOBAL", field: "count", message: `Entry count ${allEntries.length} outside ${MIN_ENTRIES}-${MAX_ENTRIES} range`, severity: "error" });
}

// Report
const errors = violations.filter(v => v.severity === "error");
const warnings = violations.filter(v => v.severity === "warning");

console.log(`\n=== Port Manifest Validator ===`);
console.log(`Entries: ${allEntries.length}`);
console.log(`Categories: ${new Set(allEntries.map(e => e.category)).size}/${VALID_CATEGORIES.size}`);
console.log(`Status: ${Array.from(new Set(allEntries.map(e => e.status))).map(s => `${s}:${allEntries.filter(e => e.status === s).length}`).join(", ")}`);
if (checkPaths) {
  const pathCount = allEntries.reduce((n, e) => n + (Array.isArray(e.v4_paths) ? e.v4_paths.length : 0), 0);
  console.log(`v4_paths checked: ${pathCount}`);
}
if (cycles.length > 0) {
  console.log(`Dependency cycles: ${cycles.length}`);
}

if (warnings.length > 0) {
  console.log(`\nWarnings: ${warnings.length}\n`);
  for (const v of warnings) {
    console.log(`  ${v.intent} -> ${v.field}: ${v.message}`);
  }
}

if (errors.length === 0) {
  console.log(`\nPASS — 0 errors${warnings.length > 0 ? ` (${warnings.length} warnings)` : ""}\n`);
  process.exit(0);
} else {
  console.log(`\nFAIL — ${errors.length} errors:\n`);
  for (const v of errors) {
    console.log(`  ${v.intent} -> ${v.field}: ${v.message}`);
  }
  console.log();
  process.exit(1);
}
