#!/usr/bin/env bash
set -euo pipefail

docker compose -f infra/docker/docker-compose.yml up -d
echo "Postgres is running on localhost:5432"
