import { Metadata } from "next";
import { Container, Section, Link } from "@/components/ui";

export const metadata: Metadata = {
  title: "Política de Privacidad | Agent Studio",
  description: "Política de privacidad de Agent Studio - Mission Control para agentes de IA",
};

const lastUpdated = "5 de octubre de 2025";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <Section variant="default" size="lg">
        <Container size="md">
          <header className="mb-12 text-center">
            <Link href="/" variant="muted" className="text-sm mb-6 inline-block hover:text-ink">
              ← Volver a Agent Studio
            </Link>
            <h1 className="text-4xl font-bold text-ink mb-4">Política de Privacidad</h1>
            <p className="text-muted">Última actualización: {lastUpdated}</p>
          </header>

          <article className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">1. Responsable del tratamiento</h2>
              <p className="text-muted leading-relaxed">
                Aicore Agency (en adelante, "nosotros", "nuestro" o "la Empresa"), con domicilio en Argentina,
                es responsable del tratamiento de los datos personales que se recopilan a través de Agent Studio
                (en adelante, "el Software" o "la Plataforma").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">2. Datos que recopilamos</h2>
              <p className="text-muted leading-relaxed mb-4">Agent Studio es una aplicación <strong className="text-ink">self-hosted</strong>: se ejecuta en tu propia infraestructura (VPS, Docker, Kubernetes, Dokploy, etc.). Por diseño:</p>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li><strong className="text-ink">No recopilamos</strong> datos de uso, telemetría, métricas ni logs de tu instancia.</li>
                <li><strong className="text-ink">No tenemos acceso</strong> a tus agentes, conversaciones, auditoría, ni configuraciones.</li>
                <li><strong className="text-ink">No enviamos</strong> ningún dato a servidores externos (salvo las llamadas directas que tú configures a proveedores de LLM: Anthropic, OpenAI, Google, Groq, OpenRouter, etc.).</li>
              </ul>
              <p className="text-muted leading-relaxed mt-4">
                Los únicos datos que "tocamos" son los estrictamente necesarios para que el Software funcione en tu servidor:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li>Credenciales de acceso al motor OpenFang (API Key) — almacenadas en variables de entorno de tu servidor.</li>
                <li>Contraseña de acceso a Studio (STUDIO_PASSWORD) y secreto de sesión (STUDIO_SECRET) — en variables de entorno.</li>
                <li>Datos de agentes, runs, eventos, aprobaciones — almacenados en <strong className="text-ink">tu PostgreSQL</strong>.</li>
                <li>Posiciones del canvas y preferencias de UI — en localStorage de tu navegador.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">3. Finalidad del tratamiento</h2>
              <p className="text-muted leading-relaxed">
                Los datos anteriores se utilizan exclusivamente para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li>Autenticar tu acceso a la interfaz (cookie de sesión firmada, HttpOnly, Secure, SameSite=Lax).</li>
                <li>Conectar con el motor OpenFang mediante su API REST y WebSocket.</li>
                <li>Persistir el historial de ejecuciones (runs), eventos normalizados y aprobaciones en tu base de datos.</li>
                <li>Recordar la disposición visual del grafo de agentes (layout) en tu navegador.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">4. Base legal</h2>
              <p className="text-muted leading-relaxed">
                El tratamiento se basa en la <strong className="text-ink">ejecución de un contrato</strong> (tienes una licencia de uso del Software)
                y en el <strong className="text-ink">interés legítimo</strong> de proporcionar la funcionalidad para la que se diseñó el Software.
                No hay consentimiento implícito para fines ajenos a la operación del Software.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">5. Comunicación a terceros</h2>
              <p className="text-muted leading-relaxed mb-3">
                <strong className="text-ink">No comunicamos tus datos a terceros.</strong> Las únicas comunicaciones de red que realiza el Software son:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li>Hacia tu motor OpenFang (red interna Docker / localhost).</li>
                <li>Hacia tu PostgreSQL (red interna Docker / localhost).</li>
                <li>Hacia proveedores de LLM que <strong className="text-ink">tú configures</strong> (Anthropic, OpenAI, Google, Groq, OpenRouter, Ollama local, etc.). Esas comunicaciones se rigen por las políticas de privacidad de cada proveedor.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">6. Transferencias internacionales</h2>
              <p className="text-muted leading-relaxed">
                Si configuras proveedores de LLM alojados fuera del Espacio Económico Europeo (p. ej., Anthropic en EE. UU.),
                la transferencia la realizas tú directamente al configurar la API Key. Agent Studio no intermedia ni almacena esas claves
                más allá de las variables de entorno de tu servidor.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">7. Derechos del usuario</h2>
              <p className="text-muted leading-relaxed mb-3">
                Como el Software se ejecuta en tu infraestructura, tú tienes control total. Puedes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li>Acceder a todos los datos (están en tu PostgreSQL y localStorage).</li>
                <li>Rectificar o suprimir cualquier dato (borra filas en tu BD, limpia localStorage).</li>
                <li>Limitar el tratamiento (desactiva el motor, revoca API keys).</li>
                <li>Portabilidad: exporta tu base de datos (pg_dump) cuando quieras.</li>
                <li>Oponerte al tratamiento: desinstala el Software.</li>
              </ul>
              <p className="text-muted leading-relaxed mt-3">
                Para ejercer estos derechos no necesitas contactarnos: tienes acceso directo a tu infraestructura.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">8. Conservación</h2>
              <p className="text-muted leading-relaxed">
                Los datos se conservan mientras mantengas el Software instalado. Tú decides la retención:
                configura políticas de borrado en tu PostgreSQL (p. ej., borrar runs {'>'} 90 días) o elimina la base de datos al desinstalar.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">9. Seguridad</h2>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li>Autenticación por cookie firmada (HMAC-SHA256) con secreto rotativo (STUDIO_SECRET).</li>
                <li>Todas las rutas privadas protegidas por middleware (falla cerrado si no hay config).</li>
                <li>Lista blanca de rutas hacia el motor OpenFang (proxy /api/of/... solo expone endpoints permitidos).</li>
                <li>Clave del motor (OPENFANG_API_KEY) solo en servidor, nunca expuesta al navegador.</li>
                <li>HTTPS obligatorio en producción (Traefik + Let's Encrypt vía Dokploy).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">10. Cookies y almacenamiento local</h2>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li><strong className="text-ink">Cookie de sesión</strong>: `studio_session` (HttpOnly, Secure, SameSite=La, Path=/). Expira a los 30 días. Contiene token HMAC, no datos personales.</li>
                <li><strong className="text-ink">localStorage</strong>: `studio-layout` (posiciones del canvas). Solo en tu navegador, nunca enviado al servidor.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">11. Cambios en esta política</h2>
              <p className="text-muted leading-relaxed">
                Cualquier actualización se publicará en esta página con nueva fecha de "Última actualización".
                Dado que el Software es self-hosted, tú controlas cuándo actualizas tu instancia.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">12. Contacto</h2>
              <p className="text-muted leading-relaxed">
                Para consultas sobre esta política: <a href="mailto:privacy@aicorebots.com" className="text-accent underline hover:[text-accent/80]">privacy@aicorebots.com</a>
              </p>
            </section>
          </article>
        </Container>
      </Section>

      <footer className="bg-panel border-t border-line py-8">
        <Container size="md" className="text-center text-sm text-muted">
          <p>© 2025 Aicore Agency. Parte de <Link href="https://aicorebots.com" target="_blank" rel="noopener" className="underline hover:text-accent">Aicore Agency</Link>.</p>
          <p className="mt-1">Basado en <Link href="https://github.com/RightNow-AI/openfang" target="_blank" rel="noopener" className="underline hover:text-accent">OpenFang v0.6.9</Link>.</p>
        </Container>
      </footer>
    </div>
  );
}