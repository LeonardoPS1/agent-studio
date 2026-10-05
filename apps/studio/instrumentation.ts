/**
 * Next.js instrumentation hook.
 * Arranca el colector server-side al iniciar el servidor, sin depender de que
 * haya un navegador abierto. El sondeo de auditoría persiste eventos de todos
 * los agentes; el WebSocket vivo se abre aparte para el agente seleccionado.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { getWsCollector } = await import('@/lib/ws-collector');
      await getWsCollector().start();
    } catch (e) {
      console.error('[instrumentation] no se pudo iniciar el colector:', e);
    }
  }
}
