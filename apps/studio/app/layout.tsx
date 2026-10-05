import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Studio | Aicore Agency",
  description: "Mission Control para operar agentes de IA. Timeline preciso, aprobaciones en tiempo real, control total de costos. Self-hosted, sin vendor lock-in.",
  openGraph: {
    title: "Agent Studio | Aicore Agency",
    description: "Mission Control para operar agentes de IA. Timeline preciso, aprobaciones en tiempo real, control total de costos.",
    type: "website",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="es"><body>{children}</body></html>);
}