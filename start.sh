#!/usr/bin/env bash
# start.sh — start the whole Campus Carpool site locally with one command (macOS / Linux / Git Bash)
# Usage: ./start.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
RUN_DIR="$ROOT/.run"
PID_FILE="$RUN_DIR/next-dev.pid"
LOG_FILE="$RUN_DIR/next-dev.log"
mkdir -p "$RUN_DIR"

say() { printf "\033[1;36m▶ %s\033[0m\n" "$1"; }
fail() { printf "\033[1;31m✖ %s\033[0m\n" "$1"; exit 1; }

# 1. Tools
command -v node >/dev/null || fail "Node.js not found. Install Node 20+."
NODE_MAJOR="$(node -v | sed 's/v\([0-9]*\).*/\1/')"
[ "$NODE_MAJOR" -ge 20 ] || fail "Node 20+ required (found $(node -v))."
command -v npm >/dev/null || fail "npm not found."

# 2. Env file
if [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    cp .env.example .env.local
    fail ".env.local created from .env.example — fill your Supabase keys, then run ./start.sh again."
  else
    fail ".env.local missing."
  fi
fi
grep -q "your-anon-key" .env.local && fail "Fill real keys in .env.local first."

# Read config from .env.local
PORT="$(grep -E '^PORT=' .env.local | cut -d= -f2 || true)"; PORT="${PORT:-3000}"
USE_LOCAL_SUPABASE="$(grep -E '^USE_LOCAL_SUPABASE=' .env.local | cut -d= -f2 || true)"

# 3. Already running?
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  say "Already running (PID $(cat "$PID_FILE")) → http://localhost:$PORT"
  exit 0
fi

# 4. Dependencies
if [ ! -d node_modules ]; then
  say "Installing dependencies..."
  npm install
fi

# 5. Optional local Supabase (Docker)
if [ "${USE_LOCAL_SUPABASE:-false}" = "true" ]; then
  command -v docker >/dev/null || fail "USE_LOCAL_SUPABASE=true but Docker not found."
  say "Starting local Supabase..."
  npx supabase start
  echo "local" > "$RUN_DIR/supabase.mode"
fi

# 6. Start Next.js in background
say "Starting Next.js on port $PORT..."
nohup npm run dev -- -p "$PORT" > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

# 7. Wait until ready (max 60s)
for i in $(seq 1 60); do
  if curl -s -o /dev/null "http://localhost:$PORT"; then
    say "✅ Site running → http://localhost:$PORT   (logs: .run/next-dev.log, stop: ./stop.sh)"
    if [ "$(uname)" = "Darwin" ]; then open "http://localhost:$PORT" >/dev/null 2>&1 || true
    elif command -v xdg-open >/dev/null; then xdg-open "http://localhost:$PORT" >/dev/null 2>&1 || true
    elif command -v explorer.exe >/dev/null; then explorer.exe "http://localhost:$PORT" >/dev/null 2>&1 || true
    fi
    exit 0
  fi
  sleep 1
done
fail "Server didn't start in 60s. Check .run/next-dev.log"
