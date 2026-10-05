# Deploy en Dokploy (OpenFang + Studio)

## Resumen

- Repo: `https://github.com/LeonardoPS1/agent-studio`
- Ruta del compose: `deploy/docker-compose.dokploy.yml`
- Proyecto Dokploy: `agent-studio`
- Servicio: `agent-studio` (tipo Compose)
- Dominio: `agentstudio.aicorebots.com`
- Container esperado (ejemplo): `agentstudio-agentstudio-1rhv0q`

## 1. Variables de entorno (Dokploy > Environment)

Crear/definir las siguientes variables para el servicio:

| Variable | Valor | Notas |
|---|---|---|
| `OPENFANG_API_KEY` | string largo aleatorio | Requerido. Usado por Studio y OpenFang. |
| `STUDIO_PASSWORD` | contraseña fuerte | Requerido para login Studio. |
| `STUDIO_SECRET` | >= 32 caracteres aleatorios | Requerido (NextAuth/session). |
| `OPENFANG_VERSION` | `v0.6.9` | Opcional (default en compose). |
| `OPENFANG_SHA256` | `4309b0bcf2adc5dac45776e2008087a8ad072933f1ae698ff8d4e06fb6b87602` | Opcional. Verifica binario. |
| `ANTHROPIC_API_KEY` | (opcional) | Según proveedor en `deploy/openfang/config.toml`. |
| `OPENAI_API_KEY` | (opcional) | idem. |
| `GEMINI_API_KEY` | (opcional) | idem. |
| `GROQ_API_KEY` | (opcional) | idem. |
| `OPENROUTER_API_KEY` | (opcional) | idem. |
| `TELEGRAM_BOT_TOKEN` | (opcional) | idem. |

## 2. Crear servicio en Dokploy (UI)

1. Dokploy > Projects > `agent-studio` (o crear proyecto con ese nombre).
2. Add Service > Compose > Git Provider (GitHub).
3. Repository: `LeonardoPS1/agent-studio`, Branch: `main`.
4. Build Path / Compose Path: `deploy/docker-compose.dokploy.yml`.
5. Guardar. Dokploy clonará, construirá y levantará `openfang` + `studio`.
6. Networks: el compose usa `dokploy-network` (external). Dokploy lo crea por defecto; no tocar.

## 3. Dominio y HTTPS (Traefik)

1. Dokploy > Services > `agent-studio` (servicio `studio`) > Domains.
2. Add Domain: `agentstudio.aicorebots.com`
3. Expose Port: `3000` (servicio studio).
4. Enable HTTPS (Let's Encrypt). Guardar.
5. DNS: crear A/AAAA o CNAME `agentstudio.aicorebots.com` → IP de VPS (51.222.207.250). Esperar propagación.

## 4. Verificación

```bash
# En VPS
docker ps | grep agentstudio
curl -I https://agentstudio.aicorebots.com/login
```

Healthchecks:
- `openfang`: `GET http://127.0.0.1:4200/api/health` (interno)
- `studio`: `GET http://127.0.0.1:3000/login` (interno)

## 5. Notas

- El motor (`openfang`) no se expone públicamente (solo red interna `internal`).
- Studio habla a `http://openfang:4200` vía `OPENFANG_URL`.
- Config OpenFang: `deploy/openfang/config.toml` montado en `/data/config.toml` (read-only). Cambios requieren redeploy.
- Límite WS: usar 1 WebSocket por agente seleccionado (no 5). Implementado en UI/bridge según Fase 2.
