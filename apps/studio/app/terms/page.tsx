import { Metadata } from "next";
import { Container, Section, Link } from "@/components/ui";

export const metadata: Metadata = {
  title: "Términos de Servicio | Agent Studio",
  description: "Términos y condiciones de uso de Agent Studio - Mission Control para agentes de IA",
};

const lastUpdated = "5 de octubre de 2025";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <Section variant="default" size="lg">
        <Container size="md">
          <header className="mb-12 text-center">
            <Link href="/" variant="muted" className="text-sm mb-6 inline-block hover:text-ink">
              ← Volver a Agent Studio
            </Link>
            <h1 className="text-4xl font-bold text-ink mb-4">Términos de Servicio</h1>
            <p className="text-muted">Última actualización: {lastUpdated}</p>
          </header>

          <article className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">1. Aceptación de los términos</h2>
              <p className="text-muted leading-relaxed">
                Al descargar, instalar, acceder o usar Agent Studio ("el Software"), aceptas quedar vinculado por estos Términos de Servicio
                ("Términos"), la <Link href="/privacy" className="text-accent underline hover:[text-accent/80]">Política de Privacidad</Link> y el
                <Link href="/legal" className="text-accent underline hover:[text-accent/80]">Aviso Legal</Link>. Si no estás de acuerdo, no uses el Software.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">2. Licencia de uso</h2>
              <p className="text-muted leading-relaxed mb-3">
                Sujeto a tu cumplimiento de estos Términos, Aicore Agency te concede una licencia limitada, no exclusiva, no transferible,
                no sublicenciable y revocable para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li>Descargar, instalar y ejecutar el Software en tu propia infraestructura (servidores, contenedores, VMs, Kubernetes, Dokploy, etc.).</li>
                <li>Usar el Software para operar agentes del motor OpenFang con fines internos de tu organización.</li>
                <li>Modificar el código fuente únicamente para adaptarlo a tu infraestructura o necesidades operativas internas.</li>
              </ul>
              <p className="text-muted leading-relaxed mt-3">
                <strong className="text-ink">No tienes derecho a:</strong> distribuir, vender, arrendar, sublicenciar, ceder, publicar, mostrar públicamente,
                realizar ingeniería inversa (salvo lo permitido por ley), crear obras derivadas para distribución, o usar el Software para
                proporcionar servicios a terceros (SaaS, hosting gestionado, consultoría operativa) sin acuerdo escrito separado.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">3. Dependencias de terceros</h2>
              <p className="text-muted leading-relaxed mb-3">
                El Software integra y depende de componentes de terceros, cada uno con su propia licencia:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li><strong className="text-ink">OpenFang</strong> (motor de agentes) — RightNow-AI — <a href="https://github.com/RightNow-AI/openfang" target="_blank" rel="noopener" className="text-accent underline hover:[text-accent/80]">Licencia OpenFang</a></li>
                <li><strong className="text-ink">Next.js</strong> — Vercel — <a href="https://github.com/vercel/next.js/blob/main/LICENSE" target="_blank" rel="noopener" className="text-accent underline hover:[text-accent/80]">MIT</a></li>
                <li><strong className="text-ink">React / React DOM</strong> — Meta — <a href="https://github.com/facebook/react/blob/main/LICENSE" target="_blank" rel="noopener" className="text-accent underline hover:[text-accent/80]">MIT</a></li>
                <li><strong className="text-ink">@xyflow/react</strong> — xyflow — <a href="https://github.com/xyflow/xyflow/blob/main/LICENSE" target="_blank" rel="noopener" className="text-accent underline hover:[text-accent/80]">MIT</a></li>
                <li><strong className="text-ink">PostgreSQL (pg)</strong> — <a href="https://www.postgresql.org/about/licence/" target="_blank" rel="noopener" className="text-accent underline hover:[text-accent/80]">PostgreSQL License</a></li>
                <li>Otras dependencias listadas en <code className="bg-ink/10 px-1 rounded">package.json</code> — cada una con su licencia correspondiente.</li>
              </ul>
              <p className="text-muted leading-relaxed mt-3">
                Tu uso del Software implica aceptación de las licencias de dichas dependencias. En caso de conflicto, prevalece la licencia más restrictiva.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">4. Uso del motor OpenFang y proveedores LLM</h2>
              <p className="text-muted leading-relaxed mb-3">
                El Software actúa como cliente del motor OpenFang. Tú eres responsable de:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li>Obtener, configurar y mantener tu propia instancia de OpenFang (versión compatible: v0.6.9).</li>
                <li>Contratar y pagar directamente a los proveedores de LLM que uses (Anthropic, OpenAI, Google, Groq, OpenRouter, Ollama local, etc.).</li>
                <li>Cumplir los términos de servicio, políticas de uso y cuotas de cada proveedor.</li>
                <li>Los costes, límites de tasa, disponibilidad y calidad de los modelos son responsabilidad exclusiva de cada proveedor.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">5. Tus responsabilidades</h2>
              <p className="text-muted leading-relaxed mb-3">Te comprometes a:</p>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li>Mantener la seguridad de tu infraestructura (servidor, red, base de datos, claves API).</li>
                <li>Configurar HTTPS/TLS válido en producción (Traefik + Let's Encrypt u equivalente).</li>
                <li>No usar el Software para actividades ilegales, maliciosas, dañinas o que infrinjan derechos de terceros.</li>
                <li>No intentar extraer, replicar o distribuir la lógica propietaria del motor OpenFang.</li>
                <li>Respetar los límites de tasa y políticas de uso de los proveedores de LLM.</li>
                <li>Realizar copias de seguridad de tu base de datos (PostgreSQL) regularmente.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">6. Datos y contenido generado</h2>
              <p className="text-muted leading-relaxed mb-3">
                Tú eres el único titular de los datos generados por tus agentes (runs, eventos, aprobaciones, conversaciones, logs).
                Aicore Agency no tiene acceso, ni reclamación, ni derecho alguno sobre dichos datos.
              </p>
              <p className="text-muted leading-relaxed">
                Eres responsable de la legalidad, exactitud y adecuación del contenido que generen tus agentes, así como del cumplimiento
                de la normativa aplicable (protección de datos, propiedad intelectual, secreto profesional, etc.) en tu jurisdicción.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">7. Actualizaciones y mantenimiento</h2>
              <p className="text-muted leading-relaxed mb-3">
                Aicore Agency puede publicar actualizaciones del Software (correcciones, mejoras, nuevas características) en el repositorio de GitHub.
                No hay obligación de proporcionar actualizaciones, parches de seguridad, soporte técnico ni mantenimiento.
              </p>
              <p className="text-muted leading-relaxed">
                Tú decides cuándo y si actualizas tu instancia. Se recomienda revisar el <a href="https://github.com/LeonardoPS1/agent-studio/releases" target="_blank" rel="noopener" className="text-accent underline hover:[text-accent/80]">changelog</a> antes de actualizar.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">8. Suspensión y terminación</h2>
              <p className="text-muted leading-relaxed mb-3">
                Aicore Agency puede revocar tu licencia (y por tanto tu derecho a usar el Software) si:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li>Incumples sustancialmente estos Términos.</li>
                <li>Usas el Software para fines ilegales o perjudiciales.</li>
                <li>Distribuyes el Software o partes sustanciales del mismo a terceros sin autorización.</li>
              </ul>
              <p className="text-muted leading-relaxed mb-3">
                Tú puedes dejar de usar el Software en cualquier momento desinstalándolo de tu infraestructura.
                La terminación no te exime de obligaciones contraídas (p. ej., pagos a proveedores LLM, obligaciones legales sobre tus datos).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">9. Limitación de responsabilidad</h2>
              <p className="text-muted leading-relaxed mb-3">
                En la máxima medida permitida por la ley aplicable, Aicore Agency no será responsable por:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li>Daños indirectos, incidentales, especiales, consecuentes o punitivos.</li>
                <li>Pérdida de beneficios, ingresos, datos, uso, buena fe u otras pérdidas intangibles.</li>
                <li>Interrupción del servicio, fallos de OpenFang, proveedores LLM, infraestructura o red.</li>
                <li>Acciones de agentes autónomos (el Software solo muestra y opera; no controla la toma de decisiones del modelo).</li>
              </ul>
              <p className="text-muted leading-relaxed mt-3">
                La responsabilidad total agregada de Aicore Agency por cualquier reclamación relacionada con el Software no excederá
                la cantidad que hayas pagado por la licencia (cero si uso gratuito/auto-desplegado).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">10. Indemnización</h2>
              <p className="text-muted leading-relaxed">
                Te comprometes a indemnizar, defender y mantener indemne a Aicore Agency, sus directivos, empleados y agentes
                frente a cualquier reclamación, daño, pérdida, coste o gasto (incluyendo honorarios razonables de abogados)
                derivados de tu uso del Software, tu incumplimiento de estos Términos o la violación de derechos de terceros.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">11. Fuerza mayor</h2>
              <p className="text-muted leading-relaxed">
                Ninguna de las partes será responsable por incumplimientos debidos a causas fuera de su control razonable
                (desastres naturales, guerras, huelgas, fallos de internet, cortes de suministro eléctrico, acciones gubernamentales, etc.).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">12. Disposiciones generales</h2>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li>Si alguna cláusula se declara nula o inaplicable, las demás permanecerán en vigor.</li>
                <li>El no ejercicio de un derecho no constituye renuncia al mismo.</li>
                <li>Estos Términos constituyen el acuerdo completo entre las partes respecto al Software.</li>
                <li>Cualquier modificación requiere acuerdo por escrito (incluye email).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">13. Legislación y jurisdicción</h2>
              <p className="text-muted leading-relaxed">
                Estos Términos se rigen por la legislación argentina. Cualquier controversia se someterá a los jueces y tribunales
                de la Ciudad de Buenos Aires, Argentina, con renuncia expresa a cualquier otro fuero.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">14. Contacto</h2>
              <p className="text-muted leading-relaxed">
                Para consultas sobre estos Términos: <a href="mailto:legal@aicorebots.com" className="text-accent underline hover:[text-accent/80]">legal@aicorebots.com</a>
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