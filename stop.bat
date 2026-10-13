@echo off
REM stop.bat — stop everything started by start.bat (Windows)
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set PORT=3000
if exist ".env.local" for /f "tokens=1,2 delims==" %%a in ('findstr /B "PORT=" ".env.local"') do set %%a=%%b

if exist ".run\next-dev.pid" (
  set /p PID=<".run\next-dev.pid"
  echo Stopping Next.js ^(PID !PID!^)...
  taskkill /PID !PID! /T /F >nul 2>nul
  del ".run\next-dev.pid" >nul 2>nul
)

REM Free the port if anything is still listening
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%PORT% " ^| findstr LISTENING') do taskkill /PID %%p /T /F >nul 2>nul

if exist ".run\supabase.mode" (
  echo Stopping local Supabase...
  call npx supabase stop
  del ".run\supabase.mode" >nul 2>nul
)

echo [OK] Everything stopped.
