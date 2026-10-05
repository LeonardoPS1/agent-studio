import { Metadata } from "next";
import { Container, Section, Link } from "@/components/ui";

export const metadata: Metadata = {
  title: "Aviso Legal | Agent Studio",
  description: "Aviso legal de Agent Studio - Mission Control para agentes de IA",
};

const lastUpdated = "5 de octubre de 2025";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <Section variant="default" size="lg">
        <Container size="md">
          <header className="mb-12 text-center">
            <Link href="/" variant="muted" className="text-sm mb-6 inline-block hover:text-ink">
              ← Volver a Agent Studio
            </Link>
            <h1 className="text-4xl font-bold text-ink mb-4">Aviso Legal</h1>
            <p className="text-muted">Última actualización: {lastUpdated}</p>
          </header>

          <article className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">1. Información general</h2>
              <p className="text-muted leading-relaxed mb-3">
                En cumplimiento del deber de información dispuesto en la normativa aplicable (Ley 34/2002 LSSI-CE, RGPD UE 2016/679, Ley 25.326 Argentina, etc.),
                se informa que el presente sitio web y software (en adelante, "la Plataforma") es titularidad de:
              </p>
              <dl className="text-muted leading-relaxed space-y-2">
                <dt className="font-semibold text-ink">Denominación social:</dt>
                <dd>Aicore Agency</dd>
                <dt className="font-semibold text-ink">Nombre comercial:</dt>
                <dd>Agent Studio</dd>
                <dt className="font-semibold text-ink">Domicilio:</dt>
                <dd>Argentina</dd>
                <dt className="font-semibold text-ink">Correo electrónico:</dt>
                <dd><a href="mailto:legal@aicorebots.com" className="text-accent underline hover:[text-accent/80]">legal@aicorebots.com</a></dd>
                <dt className="font-semibold text-ink">Sitio web:</dt>
                <dd><a href="https://aicorebots.com" target="_blank" rel="noopener" className="text-accent underline hover:[text-accent/80]">https://aicorebots.com</a></dd>
              </dl>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">2. Objeto</h2>
              <p className="text-muted leading-relaxed">
                El presente Aviso Legal regula el acceso y uso de Agent Studio ("el Software"), una aplicación web self-hosted
                que proporciona una interfaz visual (Mission Control) para operar agentes del motor OpenFang.
                El Software se distribuye bajo licencia propietaria con código fuente disponible en GitHub para auditoría y despliegue propio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">3. Condiciones de acceso y uso</h2>
              <p className="text-muted leading-relaxed mb-3">
                El acceso a la Plataforma requiere autenticación (contraseña definida por el administrador de la instancia).
                El usuario se compromete a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li>Hacer un uso lícito, diligente y honrado del Software.</li>
                <li>No intentar acceder a áreas restringidas, vulnerar la autenticación ni interferir en el funcionamiento del motor OpenFang.</li>
                <li>No distribuir, sublicenciar ni ceder el Software a terceros sin autorización expresa.</li>
                <li>Mantener la confidencialidad de las credenciales (STUDIO_PASSWORD, STUDIO_SECRET, OPENFANG_API_KEY, API keys de proveedores LLM).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">4. Propiedad intelectual e industrial</h2>
              <p className="text-muted leading-relaxed mb-3">
                Todos los derechos de propiedad intelectual e industrial sobre el Software (código fuente, diseño, estructura, documentación, marca "Agent Studio", logotipos) son titularidad exclusiva de Aicore Agency o de sus licenciantes.
              </p>
              <p className="text-muted leading-relaxed mb-3">
                El Software incluye y depende de <strong className="text-ink">OpenFang</strong> (motor de agentes), desarrollado por RightNow-AI,
                distribuido bajo su propia licencia (consultar <a href="https://github.com/RightNow-AI/openfang" target="_blank" rel="noopener" className="text-accent underline hover:[text-accent/80]">repositorio oficial</a>).
                Agent Studio no reivindica autoría sobre OpenFang; se limita a proporcionar una interfaz de operación.
              </p>
              <p className="text-muted leading-relaxed">
                Queda prohibida la reproducción, distribución, comunicación pública, transformación o cualquier otro acto de explotación
                sin autorización previa y por escrito, salvo lo permitido por la licencia de uso concedida al desplegar tu propia instancia.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">5. Exclusión de garantías y responsabilidad</h2>
              <p className="text-muted leading-relaxed mb-3">
                El Software se proporciona <strong className="text-ink">"tal cual"</strong> ("as is"), sin garantías de ningún tipo, ni expresas ni implícitas,
                incluyendo, sin limitación, garantías de comerciabilidad, idoneidad para un fin particular, no infracción o ausencia de errores.
              </p>
              <p className="text-muted leading-relaxed mb-3">
                Aicore Agency no garantiza:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted leading-relaxed">
                <li>La disponibilidad continua, ininterrumpida o libre de errores del Software.</li>
                <li>Que los resultados obtenidos mediante el uso de agentes sean precisos, completos o fiables.</li>
                <li>La compatibilidad con versiones futuras de OpenFang, proveedores de LLM, navegadores o infraestructura.</li>
              </ul>
              <p className="text-muted leading-relaxed mb-3">
                En ningún caso Aicore Agency será responsable por daños directos, indirectos, incidentales, especiales, consecuentes o punitivos
                (incluyendo pérdida de beneficios, datos, uso, buena fe u otras pérdidas intangibles) derivados del uso o imposibilidad de uso del Software.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">6. Enlaces a terceros</h2>
              <p className="text-muted leading-relaxed">
                La Plataforma puede contener enlaces a sitios web de terceros (proveedores de LLM, GitHub, Dokploy, Aicore Agency, etc.).
                Aicore Agency no controla dichos sitios y no asume responsabilidad por su contenido, políticas de privacidad o prácticas.
                El acceso a ellos es bajo tu propio riesgo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">7. Legislación aplicable y jurisdicción</h2>
              <p className="text-muted leading-relaxed">
                Las presentes condiciones se rigen por la legislación argentina. Para la resolución de cualquier controversia derivada del acceso
                o uso del Software, las partes se someten a los jueces y tribunales de la Ciudad de Buenos Aires, Argentina,
                con renuncia expresa a cualquier otro fuero que pudiera corresponderles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-ink mb-3">8. Contacto</h2>
              <p className="text-muted leading-relaxed">
                Para cualquier consulta relacionada con este Aviso Legal: <a href="mailto:legal@aicorebots.com" className="text-accent underline hover:[text-accent/80]">legal@aicorebots.com</a>
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