#!/usr/bin/env bash
# stop.sh — stop everything started by start.sh (macOS / Linux / Git Bash)
# Usage: ./stop.sh
set -uo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
RUN_DIR="$ROOT/.run"
PID_FILE="$RUN_DIR/next-dev.pid"
PORT="$(grep -E '^PORT=' .env.local 2>/dev/null | cut -d= -f2 || true)"; PORT="${PORT:-3000}"

say() { printf "\033[1;36m■ %s\033[0m\n" "$1"; }

# 1. Stop Next.js (process tree)
if [ -f "$PID_FILE" ]; then
  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" 2>/dev/null; then
    say "Stopping Next.js (PID $PID)..."
    pkill -TERM -P "$PID" 2>/dev/null || true
    kill -TERM "$PID" 2>/dev/null || true
    sleep 2
    kill -KILL "$PID" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
fi

# 2. Free the port if anything is still on it
if command -v lsof >/dev/null; then
  LEFT="$(lsof -ti tcp:"$PORT" 2>/dev/null || true)"
  [ -n "$LEFT" ] && { say "Freeing port $PORT..."; kill -9 $LEFT 2>/dev/null || true; }
elif command -v fuser >/dev/null; then
  fuser -k "$PORT"/tcp 2>/dev/null || true
fi

# 3. Stop local Supabase if start.sh started it
if [ -f "$RUN_DIR/supabase.mode" ]; then
  say "Stopping local Supabase..."
  npx supabase stop || true
  rm -f "$RUN_DIR/supabase.mode"
fi

say "✅ Everything stopped."
