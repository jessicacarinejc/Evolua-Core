#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env.homologation ]; then
  POSTGRES_PASSWORD="$(openssl rand -hex 18)"
  RABBITMQ_PASSWORD="$(openssl rand -hex 18)"
  MINIO_PASSWORD="$(openssl rand -hex 18)"
  cat > .env.homologation <<EOF
NODE_ENV=production
API_PORT=3333
API_URL=http://127.0.0.1:3333/v1
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
DATABASE_URL=postgresql://evolua_homologacao:${POSTGRES_PASSWORD}@localhost:5432/evolua_core_homologacao
SESSION_DAYS=30
DB_POOL_MAX=10
REDIS_URL=redis://localhost:6379
RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD}
RABBITMQ_URL=amqp://evolua_homologacao:${RABBITMQ_PASSWORD}@localhost:5672
MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=evolua_homologacao
S3_SECRET_KEY=${MINIO_PASSWORD}
S3_BUCKET=evolua-media-homologacao
EXPO_PUBLIC_API_URL=http://127.0.0.1:3333/v1
LOCAL_AI_URL=http://127.0.0.1:11434
LOCAL_AI_MODEL=
EOF
  chmod 600 .env.homologation
fi

COMPOSE=(docker compose --env-file .env.homologation -f docker-compose.homologation.yml)
"${COMPOSE[@]}" up -d postgres redis rabbitmq minio

for attempt in $(seq 1 40); do
  if "${COMPOSE[@]}" exec -T postgres pg_isready -U evolua_homologacao -d evolua_core_homologacao >/dev/null 2>&1; then
    break
  fi
  if [ "$attempt" -eq 40 ]; then
    echo "PostgreSQL não ficou pronto a tempo." >&2
    exit 1
  fi
  sleep 2
done

npm run homologacao:migrate

if [ -f /tmp/evolua-core-api.pid ] && kill -0 "$(cat /tmp/evolua-core-api.pid)" 2>/dev/null; then
  echo "Evolua Core API já está em execução."
else
  nohup npm run homologacao:api >/tmp/evolua-core-api.log 2>&1 &
  echo $! >/tmp/evolua-core-api.pid
fi

for attempt in $(seq 1 30); do
  if curl --silent --fail http://127.0.0.1:3333/v1/health/ready >/dev/null 2>&1; then
    echo "Evolua Core homologação pronta na porta 3333."
    echo "No Codespaces, use a URL encaminhada da porta 3333 e acrescente /v1 no aplicativo."
    exit 0
  fi
  sleep 2
done

echo "A API não ficou pronta. Consulte /tmp/evolua-core-api.log" >&2
exit 1
