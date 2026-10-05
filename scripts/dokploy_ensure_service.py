#!/usr/bin/env python3
"""
Asegura servicio Compose 'agent-studio' en Dokploy.
- Lee configuración desde .env.dokploy (o env vars)
- Busca proyecto y servicio por nombre (idempotente)
- Crea servicio Compose desde Git si no existe
- Actualiza variables de entorno y dominio si existe
Uso: python scripts/dokploy_ensure_service.py [--apply|--dry-run]
Requiere DOKPLOY_API_TOKEN (no se imprime).
"""
import argparse
import os
import sys
from pathlib import Path

try:
    import requests
except Exception:
    print("Falta requests: pip install requests", file=sys.stderr)
    sys.exit(1)

def load_env():
    env_path = Path(__file__).resolve().parent.parent / ".env.dokploy"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k, v = k.strip(), v.strip().strip('"').strip("'")
            os.environ.setdefault(k, v)

def env(k, d=""):
    return os.environ.get(k, d)

def base_url():
    u = env("DOKPLOY_API_URL", "http://51.222.207.250:3000").rstrip("/")
    return u

def headers():
    tok = env("DOKPLOY_API_TOKEN", "")
    h = {"Content-Type": "application/json", "Accept": "application/json"}
    if tok:
        h["Authorization"] = f"Bearer {tok}"
    return h

def get_projects():
    r = requests.get(f"{base_url()}/api/projects", headers=headers(), timeout=30)
    r.raise_for_status()
    return r.json()

def get_project_by_name(name):
    for p in get_projects():
        if p.get("name") == name:
            return p
    return None

def get_services(project_id):
    r = requests.get(f"{base_url()}/api/services/project/{project_id}", headers=headers(), timeout=30)
    r.raise_for_status()
    return r.json()

def get_service_by_name(project_id, name):
    for s in get_services(project_id):
        if s.get("name") == name:
            return s
    return None

def create_compose_service(project_id):
    body = {
        "name": env("DOKPLOY_SERVICE_NAME", "agent-studio"),
        "projectId": project_id,
        "type": "compose",
        "composePath": env("DOKPLOY_COMPOSE_PATH", "deploy/docker-compose.dokploy.yml"),
        "repository": {
            "owner": "LeonardoPS1",
            "repo": "agent-studio",
            "branch": env("DOKPLOY_GIT_BRANCH", "main"),
            "url": env("DOKPLOY_GIT_REPO", "https://github.com/LeonardoPS1/agent-studio"),
            "buildPath": ".",
            "composePath": env("DOKPLOY_COMPOSE_PATH", "deploy/docker-compose.dokploy.yml"),
        },
        "env": build_env(),
        "domains": build_domains(),
        "sourceType": "github",
        "buildType": "dockerfile",
    }
    r = requests.post(f"{base_url()}/api/services/compose", json=body, headers=headers(), timeout=60)
    try:
        r.raise_for_status()
    except Exception:
        print(r.text, file=sys.stderr)
        raise
    return r.json()

def build_env():
    envs = []
    def add(kname, envk):
        v = env(envk, "")
        if v:
            envs.append(f"{kname}={v}")
    add("OPENFANG_API_KEY", "DOKPLOY_ENV_OPENFANG_API_KEY")
    add("STUDIO_PASSWORD", "DOKPLOY_ENV_STUDIO_PASSWORD")
    add("STUDIO_SECRET", "DOKPLOY_ENV_STUDIO_SECRET")
    add("ANTHROPIC_API_KEY", "DOKPLOY_ENV_ANTHROPIC_API_KEY")
    add("OPENAI_API_KEY", "DOKPLOY_ENV_OPENAI_API_KEY")
    add("GEMINI_API_KEY", "DOKPLOY_ENV_GEMINI_API_KEY")
    add("GROQ_API_KEY", "DOKPLOY_ENV_GROQ_API_KEY")
    add("OPENROUTER_API_KEY", "DOKPLOY_ENV_OPENROUTER_API_KEY")
    add("TELEGRAM_BOT_TOKEN", "DOKPLOY_ENV_TELEGRAM_BOT_TOKEN")
    return "\n".join(envs)

def build_domains():
    domain = env("DOKPLOY_DOMAIN", "agentstudio.aicorebots.com")
    return [{"host": domain, "port": 3000, "https": True, "path": "/"}]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Crear/actualizar realmente")
    parser.add_argument("--dry-run", action="store_true", help="Solo mostrar estado")
    args = parser.parse_args()
    load_env()
    if not env("DOKPLOY_API_TOKEN"):
        print("DOKPLOY_API_TOKEN vacío. Edita .env.dokploy o exporta env.", file=sys.stderr)
        sys.exit(2)
    proj = get_project_by_name(env("DOKPLOY_PROJECT_NAME", "agent-studio"))
    if not proj:
        print("Proyecto no encontrado. Crear 'agent-studio' en Dokploy primero o ajustar nombre.", file=sys.stderr)
        sys.exit(3)
    proj_id = proj["projectId"]
    svc = get_service_by_name(proj_id, env("DOKPLOY_SERVICE_NAME", "agent-studio"))
    if args.dry_run or not args.apply:
        print("DRY-RUN")
        print("Proyecto:", proj.get("name"), proj_id)
        print("Servicio:", svc.get("name") if svc else "NO EXISTE")
        if svc:
            print(svc.keys())
        sys.exit(0)
    if svc:
        print("Servicio ya existe. Idempotente: no creo (actualización manual recomendada desde UI o redeploy).")
        sys.exit(0)
    res = create_compose_service(proj_id)
    print("Creado:", res.get("serviceId"), res.get("name"))
if __name__ == "__main__":
    main()
