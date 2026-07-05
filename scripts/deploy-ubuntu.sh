#!/usr/bin/env bash
set -euo pipefail

echo "=== Inventory Management - Ubuntu Setup ==="

if ! command -v docker &>/dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  echo "Log out and back in for Docker group permissions, then re-run this script."
  exit 0
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit passwords before production use."
fi

docker compose up --build -d

echo ""
echo "Inventory Management is starting."
echo "  Frontend: http://localhost:3000"
echo "  API:      http://localhost:8000/docs"
echo "  Login:    admin@company.com / admin123"
