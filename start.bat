@echo off
REM start.bat — start the whole Campus Carpool site locally (Windows). Double-click or run: start.bat
setlocal EnableDelayedExpansion
cd /d "%~dp0"
if not exist ".run" mkdir ".run"

where node >nul 2>nul || (echo [X] Node.js not found. Install Node 20+. & pause & exit /b 1)

if not exist ".env.local" (
  copy ".env.example" ".env.local" >nul
  echo [X] .env.local created from .env.example. Fill your Supabase keys, then run start.bat again.
  pause & exit /b 1
)
findstr /C:"your-anon-key" ".env.local" >nul && (echo [X] Fill real keys in .env.local first. & pause & exit /b 1)

set PORT=3000
set USE_LOCAL_SUPABASE=false
for /f "tokens=1,2 delims==" %%a in ('findstr /B "PORT= USE_LOCAL_SUPABASE=" ".env.local"') do set %%a=%%b

if exist ".run\next-dev.pid" (
  set /p OLDPID=<".run\next-dev.pid"
  tasklist /FI "PID eq !OLDPID!" | find "!OLDPID!" >nul && (echo Already running: http://localhost:%PORT% & exit /b 0)
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install || (echo [X] npm install failed & pause & exit /b 1)
)

if /I "%USE_LOCAL_SUPABASE%"=="true" (
  echo Starting local Supabase...
  call npx supabase start || (echo [X] Supabase start failed. Is Docker running? & pause & exit /b 1)
  echo local> ".run\supabase.mode"
)

echo Starting Next.js on port %PORT%...
powershell -NoProfile -Command "$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c npm run dev -- -p %PORT% > .run\next-dev.log 2>&1' -WindowStyle Hidden -PassThru; $p.Id | Out-File -Encoding ascii .run\next-dev.pid"

echo Waiting for server...
for /L %%i in (1,1,60) do (
  powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://localhost:%PORT% -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }" && (
    echo [OK] Site running: http://localhost:%PORT%   ^(stop: stop.bat^)
    start "" "http://localhost:%PORT%"
    exit /b 0
  )
  timeout /t 1 >nul
)
echo [X] Server didn't start in 60s. Check .run\next-dev.log
pause
