#!/usr/bin/env bash
set -e

# Resolve KrishiSetu root directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "🌾 Starting AgriSuvidha (कृषिसेतु) Full-Stack Platform"
echo "=========================================================="

# Ensure node/npm is in PATH
export PATH="$HOME/.local/node/bin:$PATH"

# 1. Clean up any stale port processes from previous sessions
echo "🧹 Checking & releasing ports 5001 and 5173..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# 2. Build if dist directories do not exist
if [ ! -d "server/dist" ] || [ ! -d "client/dist" ]; then
  echo "📦 Compiling TypeScript builds for server & client..."
  npm run build
fi

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || ipconfig getifaddr ap1 2>/dev/null || echo "127.0.0.1")

echo "=========================================================="
echo "🚀 Services Launching:"
echo "• Local Web App:   http://localhost:5173"
echo "• Mobile (Hotspot/Wi-Fi): http://${IP}:5173"
echo "• Backend API:     http://localhost:5001/api/v1"
echo "• Health Check:    http://localhost:5001/health"
echo "=========================================================="
echo "Press Ctrl+C to stop all services."
echo ""

# Auto-open browser after 2 seconds
(sleep 2 && open "http://localhost:5173" 2>/dev/null || true) &

npm run start:all
