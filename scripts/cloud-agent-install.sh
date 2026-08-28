#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f package.json ]]; then
  echo "package.json not found; skip install on an empty checkout" >&2
  exit 0
fi

if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
fi
