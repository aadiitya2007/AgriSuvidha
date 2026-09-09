#!/usr/bin/env bash
set -e

# Resolve KrishiSetu root directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "🌾 Starting KrishiSetu (कृषिसेतु) Full-Stack Platform"
echo "=========================================================="

# Ensure node/npm is in PATH
export PATH="$HOME/.local/node/bin:$PATH"

# Build if dist directories do not exist
if [ ! -d "server/dist" ] || [ ! -d "client/dist" ]; then
  echo "📦 Compiling TypeScript builds for server & client..."
  npm run build
fi

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || ipconfig getifaddr ap1 2>/dev/null || echo "192.168.0.105")

echo "🚀 Services Ready:"
echo "• Local Web App:   http://localhost:5173"
echo "• Mobile Wi-Fi:    http://${IP}:5173"
echo "• Backend API:     http://localhost:5001"
echo "• PostgreSQL DB:   port 5432 (auto-managed)"
echo "=========================================================="
echo "Press Ctrl+C to stop all services."
echo ""

npm run start:all
