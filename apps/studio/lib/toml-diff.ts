/**
 * Line diff based on a longest-common-subsequence (LCS) dynamic program.
 *
 * Replaces the previous positional comparison, which marked every line as
 * changed as soon as one line was inserted or removed above it.
 *
 * No external dependency. Common prefix/suffix are trimmed before the DP so
 * the usual small edits stay linear, and an input-size guard falls back to a
 * coarse block replace for pathologically large inputs.
 */

export type DiffType = 'unchanged' | 'add' | 'remove';

export interface DiffRow {
  type: DiffType;
  /** 1-based line number in the old text, or null for an inserted line. */
  oldNo: number | null;
  /** 1-based line number in the new text, or null for a removed line. */
  newNo: number | null;
  old: string | null;
  new: string | null;
}

export interface DiffStats {
  added: number;
  removed: number;
  changed: number;
}

/** Beyond this many DP cells, fall back to a coarse block replace. */
const MAX_DP_CELLS = 4_000_000;

function toLines(text: string): string[] {
  if (text === '') return [];
  return text.replace(/\r\n/g, '\n').split('\n');
}

/** Compute a line-level diff between two texts. */
export function diffLines(oldText: string, newText: string): DiffRow[] {
  const a = toLines(oldText);
  const b = toLines(newText);

  // 1) Trim the common prefix.
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;

  // 2) Trim the common suffix (without crossing the prefix).
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);

  const rows: DiffRow[] = [];

  // Unchanged prefix.
  for (let i = 0; i < start; i++) {
    rows.push({ type: 'unchanged', oldNo: i + 1, newNo: i + 1, old: a[i], new: a[i] });
  }

  // The changed middle.
  if (midA.length * midB.length > MAX_DP_CELLS) {
    for (let i = 0; i < midA.length; i++) {
      rows.push({ type: 'remove', oldNo: start + i + 1, newNo: null, old: midA[i], new: null });
    }
    for (let i = 0; i < midB.length; i++) {
      rows.push({ type: 'add', oldNo: null, newNo: start + i + 1, old: null, new: midB[i] });
    }
  } else {
    for (const r of lcsDiff(midA, midB)) {
      rows.push({
        type: r.type,
        oldNo: r.oldNo === null ? null : r.oldNo + start,
        newNo: r.newNo === null ? null : r.newNo + start,
        old: r.old,
        new: r.new,
      });
    }
  }

  // Unchanged suffix.
  for (let i = 0; i < a.length - endA; i++) {
    rows.push({
      type: 'unchanged',
      oldNo: endA + i + 1,
      newNo: endB + i + 1,
      old: a[endA + i],
      new: b[endB + i],
    });
  }

  return rows;
}

function lcsDiff(a: string[], b: string[]): DiffRow[] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      rows.push({ type: 'unchanged', oldNo: i + 1, newNo: j + 1, old: a[i], new: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: 'remove', oldNo: i + 1, newNo: null, old: a[i], new: null });
      i++;
    } else {
      rows.push({ type: 'add', oldNo: null, newNo: j + 1, old: null, new: b[j] });
      j++;
    }
  }
  while (i < n) {
    rows.push({ type: 'remove', oldNo: i + 1, newNo: null, old: a[i], new: null });
    i++;
  }
  while (j < m) {
    rows.push({ type: 'add', oldNo: null, newNo: j + 1, old: null, new: b[j] });
    j++;
  }
  return rows;
}

/**
 * Summarize a diff. `changed` counts removed lines that were paired with an
 * added line inside the same changed run (i.e. modified rather than pure
 * add/remove).
 */
export function summarizeDiff(rows: DiffRow[]): DiffStats {
  let added = 0;
  let removed = 0;
  let changed = 0;
  let i = 0;
  while (i < rows.length) {
    if (rows[i].type === 'unchanged') {
      i++;
      continue;
    }
    // Consume a run of removes followed by a run of adds.
    let removes = 0;
    while (i < rows.length && rows[i].type === 'remove') {
      removes++;
      i++;
    }
    let adds = 0;
    while (i < rows.length && rows[i].type === 'add') {
      adds++;
      i++;
    }
    removed += removes;
    added += adds;
    changed += Math.min(removes, adds);
  }
  return { added, removed, changed };
}

/** Serializable payload stored in `agent_manifests.diff_from_prev`. */
export function diffPayload(oldText: string, newText: string): Record<string, unknown> {
  const rows = diffLines(oldText, newText);
  return {
    rows,
    stats: summarizeDiff(rows),
    old_line_count: toLines(oldText).length,
    new_line_count: toLines(newText).length,
  };
}
