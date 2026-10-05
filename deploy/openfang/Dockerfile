# OpenFang con versión FIJADA y checksum verificado (sin compilar Rust en el VPS).
# Requiere glibc >= 2.34 (Debian bookworm cumple).
FROM debian:bookworm-slim

ARG OPENFANG_VERSION=v0.6.9
ARG OPENFANG_SHA256=4309b0bcf2adc5dac45776e2008087a8ad072933f1ae698ff8d4e06fb6b87602

# python3/node/npm: necesarios para skills, Hands y servidores MCP lanzados con npx/uvx
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl python3 python3-pip python3-venv nodejs npm \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL -o /tmp/of.tgz \
      "https://github.com/RightNow-AI/openfang/releases/download/${OPENFANG_VERSION}/openfang-x86_64-unknown-linux-gnu.tar.gz" \
    && echo "${OPENFANG_SHA256}  /tmp/of.tgz" | sha256sum -c - \
    && tar -xzf /tmp/of.tgz -C /usr/local/bin openfang \
    && chmod +x /usr/local/bin/openfang && rm /tmp/of.tgz \
    && openfang --version

ENV OPENFANG_HOME=/data \
    OPENFANG_LISTEN=0.0.0.0:4200
VOLUME /data
EXPOSE 4200
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD curl -fsS http://127.0.0.1:4200/api/health || exit 1
ENTRYPOINT ["openfang"]
CMD ["start"]
