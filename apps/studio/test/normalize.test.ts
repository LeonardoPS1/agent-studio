import { normalizeAgentStatus, clampPending } from '@/lib/normalize';

describe('normalizeAgentStatus', () => {
  it('mapea estados básicos', () => {
    expect(normalizeAgentStatus('stopped')).toBe('stopped');
    expect(normalizeAgentStatus('STOPPED')).toBe('stopped');
    expect(normalizeAgentStatus('error')).toBe('error');
    expect(normalizeAgentStatus('failed')).toBe('error');
    expect(normalizeAgentStatus('waiting for approval')).toBe('waiting');
    expect(normalizeAgentStatus('approval_pending')).toBe('waiting');
    expect(normalizeAgentStatus('using_tool')).toBe('tool');
    expect(normalizeAgentStatus('tool_call')).toBe('tool');
    expect(normalizeAgentStatus('thinking')).toBe('thinking');
    expect(normalizeAgentStatus('reasoning')).toBe('thinking');
    expect(normalizeAgentStatus('idle')).toBe('idle');
    expect(normalizeAgentStatus('ready')).toBe('idle');
    expect(normalizeAgentStatus(null)).toBe('idle');
    expect(normalizeAgentStatus(undefined)).toBe('idle');
    expect(normalizeAgentStatus('')).toBe('idle');
  });

  it('prioriza estados críticos', () => {
    expect(normalizeAgentStatus('error while thinking')).toBe('error');
    expect(normalizeAgentStatus('stopped during tool')).toBe('stopped');
    expect(normalizeAgentStatus('waiting on tool')).toBe('waiting');
  });
});

describe('clampPending', () => {
  it('limita valores inválidos', () => {
    expect(clampPending(0)).toBe(0);
    expect(clampPending(3)).toBe(3);
    expect(clampPending(-1)).toBe(0);
    expect(clampPending(NaN)).toBe(0);
    expect(clampPending(Infinity)).toBe(0);
    expect(clampPending('5')).toBe(5);
    expect(clampPending(null)).toBe(0);
  });
});
