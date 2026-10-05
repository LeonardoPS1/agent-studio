import { NormalizedEvent, EventType, isoNow } from '@/lib/events';

describe('events types', () => {
  it('formato válido', () => {
    const e: NormalizedEvent = {
      seq: 1,
      ts: isoNow(),
      run_id: 'run-1',
      agent_id: 'a1',
      type: 'tool_call',
      data: { tool: 'web.search' },
    };
    expect(e.type).toBe('tool_call');
    expect(e.seq).toBe(1);
    expect(e.agent_id).toBe('a1');
  });

  it('soporta todos los tipos', () => {
    const types: EventType[] = [
      'agent_state','llm','tool_call','tool_result','approval_required',
      'message','thought','error','budget','phase','typing'
    ];
    types.forEach(t => expect(typeof t).toBe('string'));
  });
});
