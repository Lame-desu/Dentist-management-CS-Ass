#!/bin/sh
# ── Backend Docker Entrypoint ─────────────────────
# Ensures node_modules are installed after volume
# mount, then starts the application.
# ──────────────────────────────────────────────────

set -e

echo "📦 Installing backend dependencies..."
npm install

echo "🚀 Starting backend server..."
exec "$@"
