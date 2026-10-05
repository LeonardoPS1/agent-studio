# OpenFang Studio

Interfaz visual (Mission Control) para operar agentes de [OpenFang](https://github.com/RightNow-AI/openfang): un mapa vivo de agentes y subagentes, actividad en tiempo real, aprobaciones, presupuesto, integridad de la auditoría y un inspector por agente.

Motor probado: **OpenFang v0.6.9** (binario oficial, checksum fijado).

## Qué incluye ahora (Fase 1)
- **Mission Control:** grafo de agentes con estado en vivo (pensando, herramienta, esperando aprobación, detenido), relaciones padre-hijo y entre pares, posiciones movibles que se recuerdan.
- **Actividad en vivo** desde la cadena de auditoría del motor, con filtro por agente.
- **Aprobaciones:** bandeja con Aprobar/Rechazar.
- **Inspector de agente:** modelo, permisos, herramientas, skills, MCP, sesión, reinicio/detención y chat de prueba.
- **Barra superior:** conexión con el motor, gasto del día, integridad de la cadena de auditoría.
- **Seguridad:** login con cookie firmada, lista blanca de rutas hacia el motor, clave del motor solo en el servidor, límite de intentos.

## Lo que falta (ver plan en PDF)
Constructor visual, creación asistida, replay y bifurcación, Hands y calendario, canales, evals, espacios de trabajo y roles, PWA con notificaciones. El estado exacto está en el documento de requisitos.

## Estructura
```
apps/studio/            Next.js + React Flow
  app/api/events        agregador SSE (agentes, topología, aprobaciones, presupuesto, auditoría)
  app/api/of/[...path]  proxy con lista blanca hacia OpenFang
  components/           Canvas e Inspector
deploy/
  openfang/             Dockerfile (versión fijada + SHA-256) y config.toml
  docker-compose.dokploy.yml
scripts/verify_contract.py   comprueba que el motor cumple lo que Studio necesita
docs/DOKPLOY.md         guía de despliegue paso a paso
```

## Desarrollo local
```bash
# Motor (descarga el binario v0.6.9 de la release oficial y arráncalo)
export OPENFANG_API_KEY=clave-local OPENFANG_LISTEN=127.0.0.1:4200
openfang start

# Studio
cd apps/studio && npm install
OPENFANG_URL=http://127.0.0.1:4200 OPENFANG_API_KEY=clave-local \
STUDIO_PASSWORD=clave STUDIO_SECRET=$(openssl rand -hex 32) npm run dev
```

## Limitaciones conocidas (honestas)
- El estado "usando herramienta" se infiere de la cadena de auditoría (sondeo cada 1,5 s, ventana de 4 s): es aproximado. El WebSocket por agente trae `tool_start`/`tool_end`, pero el motor limita 5 conexiones WebSocket por IP, así que no se puede abrir uno por agente: el plan usa uno solo para el agente seleccionado.
- Las aristas entre pares salen del historial del bus de eventos (hasta 500 eventos).
- No probado: build de Docker y despliegue en Dokploy; la interfaz no se revisó en un navegador (sí el servidor, el proxy y el flujo SSE contra el motor real).
- Con una clave de proveedor ausente, los agentes responden con error: Studio lo muestra como "Falta clave del proveedor".
