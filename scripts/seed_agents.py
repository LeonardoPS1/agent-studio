#!/usr/bin/env python3
"""Crea agentes en OpenFang a partir de catalog/agents/*/agent.toml (POST /api/agents).

Uso (desde un lugar que alcance el motor, p. ej. dentro de su contenedor):
  OPENFANG_URL=http://127.0.0.1:4200 OPENFANG_API_KEY=... python3 seed_agents.py [nombre ...]
Sin argumentos crea todos los manifiestos del catálogo. Omite los que ya existen por nombre.
"""
import json
import os
import pathlib
import sys
import urllib.error
import urllib.request

URL = os.environ.get("OPENFANG_URL", "http://127.0.0.1:4200").rstrip("/")
KEY = os.environ.get("OPENFANG_API_KEY", "")
ROOT = pathlib.Path(os.environ.get("CATALOG_DIR", pathlib.Path(__file__).resolve().parent.parent / "catalog" / "agents"))


def call(method, path, body=None):
    req = urllib.request.Request(URL + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"content-type": "application/json", "authorization": f"Bearer {KEY}"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode() or "null")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:200]


st, existing = call("GET", "/api/agents")
if st != 200:
    sys.exit(f"No se pudo listar agentes (HTTP {st}). ¿Clave correcta?")
have = {a["name"] for a in existing}
wanted = sys.argv[1:] or sorted(p.name for p in ROOT.iterdir() if (p / "agent.toml").is_file())
for name in wanted:
    f = ROOT / name / "agent.toml"
    if not f.is_file():
        print(f"- {name}: no existe en el catálogo"); continue
    if name in have:
        print(f"= {name}: ya existe, se omite"); continue
    st, res = call("POST", "/api/agents", {"manifest_toml": f.read_text(encoding="utf-8")})
    print(f"{'+' if st == 201 else '!'} {name}: HTTP {st} {'' if st == 201 else res}")
