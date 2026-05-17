#!/bin/sh
# ── Frontend Docker Entrypoint ────────────────────
# Ensures node_modules are installed after volume
# mount, then starts the application.
# ──────────────────────────────────────────────────

set -e

echo "📦 Installing frontend dependencies..."
npm install

echo "🚀 Starting frontend dev server..."
exec "$@"
