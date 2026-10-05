#!/usr/bin/env python3
"""Helper para inspeccionar VPS Dokploy/OpenFang via SSH (Paramiko).

Lee credenciales:
- Por defecto: C:/Users/Leonardo/AppData/Local/Temp/opencode/atlas-ssh.txt
- Alternativa: variables de entorno VPS_HOST/VPS_PORT/VPS_USER/VPS_PASSWORD

Uso por defecto (read-only):
  python scripts/vps_inspect.py --summary

Comprobar verify_contract.py dentro de contenedor openfang:
  python scripts/vps_inspect.py --verify-contract

Ver logs recientes:
  python scripts/vps_inspect.py --logs openfang --tail 60

Instalar dependencias si faltan:
  python scripts/vps_inspect.py --ensure-deps --summary

Advertencia: NO ejecutar acciones destructivas. Este script es para inspección.
"""
import argparse
import os
import sys
from pathlib import Path

TEMP_SSH = Path(r"C:/Users/Leonardo/AppData/Local/Temp/opencode/atlas-ssh.txt")


def _ensure_deps():
    try:
        import paramiko  # noqa
        return True
    except Exception:
        import subprocess

        print("Instalando paramiko...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "--quiet"])
        try:
            import paramiko  # noqa
            return True
        except Exception as e:
            print(f"ERROR: no se pudo instalar paramiko: {e}", file=sys.stderr)
            return False


def _load_creds():
    host = os.getenv("VPS_HOST")
    port = os.getenv("VPS_PORT")
    user = os.getenv("VPS_USER")
    pwd = os.getenv("VPS_PASSWORD")
    if host and user:
        return host, int(port or "22"), user, pwd or ""
    if TEMP_SSH.exists():
        txt = TEMP_SSH.read_text(encoding="utf-8", errors="ignore")
        m = {}
        for line in txt.splitlines():
            s = line.strip()
            if not s or s.startswith("#"):
                continue
            if "=" in s:
                k, v = s.split("=", 1)
                m[k.strip().lower()] = v.strip()
        host_v = m.get("host")
        port_v = int(m.get("port") or "22")
        user_v = m.get("user") or ""
        pwd_v = m.get("password") or ""
        if host_v and user_v:
            return host_v, port_v, user_v, pwd_v
    raise SystemExit("No se encontraron credenciales SSH (vars VPS_* o atlas-ssh.txt)")


def run_cmd(host, port, user, pwd, cmd: str, timeout: int = 120):
    import paramiko

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, port=port, username=user, password=pwd, timeout=timeout)
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode("utf-8", errors="ignore")
        err = stderr.read().decode("utf-8", errors="ignore")
        rc = stdout.channel.recv_exit_status()
        return rc, out, err
    finally:
        client.close()


def main():
    ap = argparse.ArgumentParser(description="VPS inspect helper")
    ap.add_argument("--ensure-deps", action="store_true")
    ap.add_argument("--summary", action="store_true", help="Resumen: docker ps + uptime + disk")
    ap.add_argument("--verify-contract", action="store_true", help="Ejecuta verify_contract.py en contenedor openfang")
    ap.add_argument("--logs", type=str, help="Contenedor: openfang|studio")
    ap.add_argument("--tail", type=int, default=40)
    ap.add_argument("--allow-write", action="store_true", help="Permitir comandos no read-only (peligroso)")
    args = ap.parse_args()

    if args.ensure_deps and not _ensure_deps():
        sys.exit(1)
    if not _ensure_deps():
        sys.exit(1)

    host, port, user, pwd = _load_creds()
    print(f"Conectando {user}@{host}:{port} ...")

    if args.summary:
        cmds = [
            "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'",
            "uptime",
            "df -h /",
        ]
        for c in cmds:
            rc, out, err = run_cmd(host, port, user, pwd, c)
            print("=== ", c, " (rc=", rc, ") ===")
            print(out or err)
            print()

    if args.verify_contract:
        c = "docker exec openfang python3 scripts/verify_contract.py 2>&1 | tail -60"
        rc, out, err = run_cmd(host, port, user, pwd, c)
        print("=== verify_contract (rc=", rc, ") ===")
        print(out or err)
        print()

    if args.logs:
        name = args.logs.strip()
        if name not in ("openfang", "studio"):
            raise SystemExit("--logs debe ser openfang o studio")
        c = f"docker logs --tail={args.tail} {name} 2>&1"
        rc, out, err = run_cmd(host, port, user, pwd, c)
        print(f"=== logs {name} (rc={rc}) ===")
        print(out or err)
        print()

    if not any([args.summary, args.verify_contract, args.logs]):
        ap.print_help()


if __name__ == "__main__":
    main()
