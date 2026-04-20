#!/bin/bash
# ============================================================
# Start Frontend Dev Server
# Ensures correct PATH and memory limits to prevent OOM kills
# ============================================================

# Ensure /usr/local/bin is in PATH (where node is installed)
export PATH="/usr/local/bin:$PATH"

# Verify node is accessible
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: node not found. Tried PATH: $PATH"
    exit 1
fi

echo "✓ Node: $(node --version)"
echo "✓ npm:  $(npm --version)"
echo "✓ Starting Next.js dev server on http://localhost:3000"

cd "$(dirname "$0")/frontend"

# Set memory limit to 2GB to prevent OOM kills
export NODE_OPTIONS="--max-old-space-size=2048"
export NEXT_TELEMETRY_DISABLED=1

exec npm run dev
