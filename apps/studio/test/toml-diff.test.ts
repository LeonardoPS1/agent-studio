import { diffLines, summarizeDiff, diffPayload } from '../lib/toml-diff';

describe('toml-diff', () => {
  it('marks identical text as unchanged', () => {
    const rows = diffLines('a\nb\nc', 'a\nb\nc');
    expect(rows.every((r) => r.type === 'unchanged')).toBe(true);
    expect(summarizeDiff(rows)).toEqual({ added: 0, removed: 0, changed: 0 });
  });

  it('reports a single insertion instead of flagging every following line', () => {
    const rows = diffLines('a\nc', 'a\nb\nc');
    const added = rows.filter((r) => r.type === 'add');
    const unchanged = rows.filter((r) => r.type === 'unchanged');
    expect(added).toHaveLength(1);
    expect(added[0].new).toBe('b');
    expect(unchanged).toHaveLength(2);
    expect(summarizeDiff(rows)).toEqual({ added: 1, removed: 0, changed: 0 });
  });

  it('reports a deletion', () => {
    const rows = diffLines('a\nb\nc', 'a\nc');
    const removed = rows.filter((r) => r.type === 'remove');
    expect(removed).toHaveLength(1);
    expect(removed[0].old).toBe('b');
    expect(summarizeDiff(rows)).toEqual({ added: 0, removed: 1, changed: 0 });
  });

  it('represents a modification as remove + add', () => {
    const rows = diffLines('a\nold_value\nc', 'a\nnew_value\nc');
    const removed = rows.filter((r) => r.type === 'remove');
    const added = rows.filter((r) => r.type === 'add');
    expect(removed).toHaveLength(1);
    expect(added).toHaveLength(1);
    expect(removed[0].old).toBe('old_value');
    expect(added[0].new).toBe('new_value');
    expect(summarizeDiff(rows).changed).toBe(1);
  });

  it('keeps line numbers consistent with each side', () => {
    const rows = diffLines('a\nb\nc', 'a\nc');
    for (const r of rows) {
      if (r.type !== 'remove' && r.new != null) expect(r.newNo).toBeGreaterThan(0);
      if (r.type !== 'add' && r.old != null) expect(r.oldNo).toBeGreaterThan(0);
    }
  });

  it('diffPayload exposes rows, stats and line counts', () => {
    const payload = diffPayload('a\nb', 'a\nb\nc') as any;
    expect(payload.old_line_count).toBe(2);
    expect(payload.new_line_count).toBe(3);
    expect(payload.stats).toEqual({ added: 1, removed: 0, changed: 0 });
    expect(Array.isArray(payload.rows)).toBe(true);
  });
});
