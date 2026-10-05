#!/usr/bin/env python3
"""Verifica que el OpenFang desplegado cumple el contrato que usa Studio (probado en v0.6.9).

Uso:
  OPENFANG_URL=http://127.0.0.1:4200 OPENFANG_API_KEY=... python3 scripts/verify_contract.py
Solo lee (GET); no crea ni modifica nada. Sale con código 1 si algo falla.
"""
import json
import os
import sys
import urllib.error
import urllib.request

URL = os.environ.get("OPENFANG_URL", "http://127.0.0.1:4200").rstrip("/")
KEY = os.environ.get("OPENFANG_API_KEY", "")
fails = 0


def get(path, auth=True):
    req = urllib.request.Request(URL + path)
    if auth and KEY:
        req.add_header("Authorization", f"Bearer {KEY}")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read().decode() or "null")
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:  # noqa: BLE001
        return 0, str(e)


def check(name, ok, detail=""):
    global fails
    print(f"[{'OK ' if ok else 'FALLA'}] {name}" + (f"  ({detail})" if detail else ""))
    if not ok:
        fails += 1


s, d = get("/api/version", auth=False)
check("Versión del motor", s == 200 and isinstance(d, dict), str(d))
if isinstance(d, dict) and d.get("version") != "0.6.9":
    print("  AVISO: Studio se probó con 0.6.9; revisa cambios antes de actualizar.")

s, agents = get("/api/agents")
check("GET /api/agents devuelve lista", s == 200 and isinstance(agents, list), f"{len(agents) if isinstance(agents, list) else '?'} agentes")
if isinstance(agents, list) and agents:
    need = {"id", "name", "state", "model_name", "model_provider", "is_inferencing", "last_active", "auth_status"}
    check("Campos de agente que usa Studio", need <= set(agents[0]), "faltan: " + ", ".join(sorted(need - set(agents[0]))) if not need <= set(agents[0]) else "")

s, d = get("/api/comms/topology")
check("GET /api/comms/topology (nodos y aristas)", s == 200 and isinstance(d, dict) and {"nodes", "edges"} <= set(d), f"HTTP {s}")
s, d = get("/api/approvals")
check("GET /api/approvals", s == 200 and isinstance(d, dict) and "approvals" in d, f"HTTP {s}")
s, d = get("/api/budget")
check("GET /api/budget", s == 200 and isinstance(d, dict) and "daily_spend" in d, f"HTTP {s}")
s, d = get("/api/audit/recent?n=5")
check("GET /api/audit/recent", s == 200 and isinstance(d, dict) and "entries" in d, f"HTTP {s}")
if isinstance(d, dict) and d.get("entries"):
    need = {"seq", "timestamp", "agent_id", "action", "detail", "outcome", "hash"}
    check("Campos de auditoría", need <= set(d["entries"][0]))
s, d = get("/api/audit/verify")
check("GET /api/audit/verify (cadena íntegra)", s == 200 and isinstance(d, dict) and d.get("valid") is True, str(d))

# Seguridad: con clave configurada, un endpoint protegido debe rechazar peticiones sin ella.
if KEY:
    s, _ = get("/api/audit/recent", auth=False)
    check("Endpoint protegido exige clave", s == 401, f"HTTP {s} sin clave")
    print("  NOTA: desde fuera de loopback, estos GET son públicos en 0.6.9 aunque haya clave: "
          "/api/agents, /api/approvals, /api/budget, /api/config, /api/channels, /api/sessions, /api/hands, /api/logs/stream. "
          "Por eso el puerto 4200 NUNCA debe publicarse.")
else:
    print("  AVISO: OPENFANG_API_KEY vacía; no se puede comprobar la autenticación.")

print("\nResultado:", "TODO OK" if fails == 0 else f"{fails} comprobaciones fallaron")
sys.exit(1 if fails else 0)
