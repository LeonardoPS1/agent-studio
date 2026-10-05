# Despliegue en Dokploy (paso a paso)

Resultado: `https://studio.tudominio.com` (Studio, con contraseña) hablando con OpenFang por la red interna. **OpenFang no se publica.**

> Probado en el entorno de desarrollo: el motor v0.6.9 (binario oficial) y Studio funcionan juntos, con login, proxy y flujo de eventos.
> **No probado:** el build de Docker ni el despliegue en Dokploy (no había Docker disponible). Los nombres de menú de Dokploy pueden variar según la versión.

## 0. Antes de empezar
- VPS con Dokploy funcionando y un dominio (o subdominio) que puedas apuntar al VPS.
- Un repositorio Git privado con este proyecto (Dokploy clona el repo y construye las imágenes).
- Al menos una clave de proveedor de modelos (Anthropic, OpenAI, Gemini, Groq u OpenRouter).
- Memoria: el contenedor del motor usa el binario precompilado; no se compila Rust en el VPS.

## 1. Sube el proyecto a tu repositorio
```bash
cd openfang-studio
git init && git add . && git commit -m "OpenFang Studio"
git remote add origin git@github.com:TU_USUARIO/openfang-studio.git
git push -u origin main
```

## 2. Genera los secretos
```bash
openssl rand -hex 32   # OPENFANG_API_KEY
openssl rand -hex 32   # STUDIO_SECRET
# STUDIO_PASSWORD: la contraseña con la que entrarás a Studio (larga y única)
```

## 3. Crea el servicio en Dokploy
1. **Projects → (tu proyecto) → Create Service → Compose**.
2. Tipo: **Docker Compose**. Provider: **Git** (o GitHub si conectaste la app). Repo, rama `main`.
3. **Compose Path:** `./deploy/docker-compose.dokploy.yml`.
4. Pestaña **Environment**: pega el contenido de `.env.example` con tus valores
   (`OPENFANG_API_KEY`, `STUDIO_PASSWORD`, `STUDIO_SECRET` y tus claves de proveedor).
5. Si usas un modelo distinto de Anthropic, edita `deploy/openfang/config.toml` (`provider`, `model`, `api_key_env`) antes de desplegar.

## 4. Dominio y HTTPS
1. DNS: crea un registro **A** `studio` → IP del VPS.
2. Pestaña **Domains → Add Domain**: Host `studio.tudominio.com`, **Service Name `studio`**, **Port `3000`**, HTTPS activado (Let's Encrypt).
3. **No agregues dominio ni puertos al servicio `openfang`.** Ver "Por qué" abajo.

## 5. Despliega
Pulsa **Deploy** y sigue los logs. La primera construcción tarda unos minutos (descarga el binario y verifica su checksum SHA-256).
Cuando termine entra a `https://studio.tudominio.com` y usa tu contraseña.

## 6. Verifica el contrato (recomendado)
El motor no está publicado, así que los scripts se ejecutan dentro de su contenedor (la imagen ya incluye python3):
```bash
OF=$(docker ps -qf name=openfang)            # id del contenedor del motor
docker cp scripts $OF:/tmp/scripts
docker exec -e OPENFANG_API_KEY=TU_CLAVE $OF python3 /tmp/scripts/verify_contract.py
```
Debe terminar en `TODO OK`.

## 7. Crear tus primeros agentes
Studio opera y observa en esta fase; los agentes se crean con la API del motor. El repositorio trae manifiestos de ejemplo (assistant, orchestrator, researcher, coder, writer):
```bash
docker cp catalog $OF:/tmp/catalog
docker exec -e OPENFANG_API_KEY=TU_CLAVE -e CATALOG_DIR=/tmp/catalog/agents $OF \
  python3 /tmp/scripts/seed_agents.py            # todos; o: ... seed_agents.py coder writer
```
Aparecen al instante en Mission Control. El script omite los que ya existen.

## Por qué el motor no se publica
En la versión 0.6.9 muchos endpoints GET son **públicos aunque configures una clave**: lista de agentes, aprobaciones, presupuesto, configuración, canales, sesiones, Hands y el flujo de logs de auditoría (`/api/logs/stream`). Solo las escrituras y algunas lecturas exigen la clave.
Por eso solo Studio (con contraseña) es accesible desde internet y el motor queda en la red interna de Docker.

## Actualizar OpenFang
1. Revisa las notas de la versión nueva (el proyecto es pre-1.0 y puede romper compatibilidad).
2. Cambia `OPENFANG_VERSION` y `OPENFANG_SHA256` juntos en Environment (el checksum está en el archivo `.sha256` de la release).
3. Despliega y ejecuta `verify_contract.py`.

## Problemas comunes
| Síntoma | Causa probable | Solución |
|---|---|---|
| Studio muestra "Sin conexión con el motor" | Clave distinta entre servicios o motor aún arrancando | Revisa `OPENFANG_API_KEY` y los logs de `openfang` |
| Nodo con "Falta clave del proveedor" | Variable del proveedor vacía | Rellena la clave en Environment y redespliega |
| 503 "Studio no está configurado" | Falta `STUDIO_PASSWORD` o `STUDIO_SECRET` | Defínelas en Environment |
| `docker compose` falla por `dokploy-network` | La red externa no existe en tu instalación | Crea la red o quita `dokploy-network` y usa los dominios de Dokploy |
| Build falla al verificar checksum | Versión y hash no coinciden | Usa el `.sha256` oficial de esa versión |
