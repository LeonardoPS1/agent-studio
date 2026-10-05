"use client";
import { Container, Section, Button, Card, CardContent, Link } from "@/components/ui";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Mission Control Visual",
    description: "Mapa vivo de agentes y subagentes con estado en tiempo real: pensando, usando herramientas, esperando aprobación, detenido. Relaciones padre-hijo y entre pares.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Timeline Preciso (<3s)",
    description: "WebSocket nativo al agente seleccionado captura tool_start/tool_end con precisión de milisegundos. Carriles horizontales por agente con duración exacta de cada herramienta.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Aprobaciones en Tiempo Real",
    description: "Bandeja centralizada: cuando un agente quiere ejecutar una acción sensible, aparece para aprobar/rechazar. Decisiones auditadas y trazables.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    ),
    title: "Inspector Profundo por Agente",
    description: "Modelo, permisos, herramientas, skills, MCP, sesión completa. Chat de prueba integrado. Reinicio y detención controlada.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Costos y Presupuestos",
    description: "Gasto diario con barra de progreso, límite configurable. Tokens in/out por run y agente. Alertas antes de exceder presupuesto.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    title: "Self-Hosted & Sin Vendor Lock-in",
    description: "Corre en tu infraestructura (Dokploy, Docker, Kubernetes). Tus datos, tus modelos, tus reglas. Basado en OpenFang v0.6.9 motor probado.",
  },
];

const differentiators = [
  {
    title: "Control Total de Datos",
    description: "Nada sale de tu infraestructura. Agentes, conversaciones, métricas y auditoría viven en tu PostgreSQL. Cumple GDPR, HIPAA, SOC2 por diseño.",
    highlight: "Tu VPS, tus reglas",
  },
  {
    title: "Timeline Real, No Muestreado",
    description: "La mayoría de herramientas muestrea o hace polling cada 5-30s. Agent Studio usa WebSocket dedicado al agente activo: precisión de milisegundos en tool_start/tool_end.",
    highlight: "Precisión <3s objetivo",
  },
  {
    title: "Aprobaciones Nativas del Motor",
    description: "No es un wrapper: las aprobaciones vienen del motor OpenFang. El agente se detiene y espera tu decisión. Audit trail completo sin configuración extra.",
    highlight: "Seguridad real, no teatro",
  },
  {
    title: "Costo Predecible",
    description: "Sin cargos por asiento, por evento, por millón de tokens. Pagas tu infraestructura + proveedores de LLM directamente. Cero markup, cero sorpresas en la factura.",
    highlight: "Tu factura, tu control",
  },
];

const footerLinks = {
  product: [
    { label: "Características", href: "#features" },
    { label: "Diferenciadores", href: "#differentiators" },
    { label: "Documentación", href: "https://github.com/LeonardoPS1/agent-studio" },
    { label: "Changelog", href: "https://github.com/LeonardoPS1/agent-studio/releases" },
  ],
  company: [
    { label: "Aicore Agency", href: "https://aicorebots.com" },
    { label: "Med.aicorebots.com", href: "https://med.aicorebots.com" },
    { label: "Iapo.cl", href: "https://iapo.cl" },
    { label: "Captación360", href: "https://captacion360.aicorebots.com" },
  ],
  legal: [
    { label: "Política de Privacidad", href: "/privacy" },
    { label: "Aviso Legal", href: "/legal" },
    { label: "Términos de Servicio", href: "/terms" },
  ],
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Hero Section */}
      <Section variant="default" size="xl" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--accent)_0%,_transparent_70%)] opacity-10" />
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Basado en OpenFang v0.6.9 · Parte de Aicore Agency
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink mb-6">
            Agent Studio
            <br />
            <span className="text-accent">Mission Control</span> para tus agentes de IA
          </h1>
          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Opera flotas de agentes con timeline preciso, aprobaciones en tiempo real y control total de costos.
            Self-hosted en tu infraestructura. Sin vendor lock-in. Sin sorpresas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => window.location.href = "/login"}>
              Entrar al Studio
            </Button>
            <Link 
              href="https://github.com/LeonardoPS1/agent-studio" 
              variant="muted" 
              className="w-full sm:w-auto text-center"
              target="_blank" 
              rel="noopener noreferrer"
            >
              Ver en GitHub
            </Link>
          </div>
        </div>
      </Section>

      {/* Features Section */}
      <Section variant="muted" size="lg" id="features">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">Todo lo que necesitas para operar agentes en producción</h2>
          <p className="text-muted text-lg">Características diseñadas para equipos que necesitan visibilidad, control y velocidad.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} variant="elevated" padding="lg" className="transition-all duration-200 hover:shadow-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-ink mb-2">{feature.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Differentiators Section */}
      <Section variant="default" size="lg" id="differentiators">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-4">¿Por qué Agent Studio y no otras herramientas?</h2>
          <p className="text-muted text-lg">Comparación honesta con alternativas populares (LangGraph Studio, LangSmith, AgentOps, etc.)</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {differentiators.map((diff, index) => (
            <div key={index} className="p-6 bg-panel border border-line rounded-xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-ink mb-1">{diff.title}</h3>
                  <p className="text-muted mb-3">{diff.description}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                    {diff.highlight}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA Section */}
      <Section variant="accent" size="lg" className="text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Listo para operar tus agentes con control total</h2>
        <p className="text-accent/80 text-lg mb-8 max-w-2xl mx-auto">
          Despliega en minutos en Dokploy, Docker o Kubernetes. Conecta tu motor OpenFang y empieza a ver la actividad en tiempo real.
        </p>
        <Button size="lg" onClick={() => window.location.href = "/login"} className="bg-white text-accent hover:bg-white/90">
          Empezar ahora
        </Button>
      </Section>

      {/* Footer */}
      <footer className="bg-panel border-t border-line">
        <Container size="lg" className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-8 h-8 text-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                <span className="text-xl font-bold text-ink">Agent Studio</span>
              </div>
              <p className="text-muted text-sm mb-4">Mission Control para agentes de IA. Parte de <strong className="text-ink">Aicore Agency</strong>.</p>
              <div className="flex gap-4">
                <Link href="https://github.com/LeonardoPS1/agent-studio" variant="muted" className="text-sm" target="_blank" rel="noopener">GitHub</Link>
                <Link href="https://aicorebots.com" variant="muted" className="text-sm" target="_blank" rel="noopener">Aicore Agency</Link>
              </div>
            </div>
            <nav>
              <h4 className="font-semibold text-ink mb-3">Producto</h4>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.label}><Link href={link.href} variant="muted" className="text-sm">{link.label}</Link></li>
                ))}
              </ul>
            </nav>
            <nav>
              <h4 className="font-semibold text-ink mb-3">Aicore Agency</h4>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.label}><Link href={link.href} variant="muted" className="text-sm" target="_blank" rel="noopener">{link.label}</Link></li>
                ))}
              </ul>
            </nav>
            <nav>
              <h4 className="font-semibold text-ink mb-3">Legal</h4>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}><Link href={link.href} variant="muted" className="text-sm">{link.label}</Link></li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="pt-8 border-t border-line flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted text-sm">© 2025 Aicore Agency. Todos los derechos reservados.</p>
            <p className="text-muted text-sm">Basado en <a href="https://github.com/RightNow-AI/openfang" target="_blank" rel="noopener" className="underline hover:text-accent">OpenFang v0.6.9</a></p>
          </div>
        </Container>
      </footer>
    </div>
  );
}