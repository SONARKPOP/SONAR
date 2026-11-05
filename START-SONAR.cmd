@echo off
setlocal
cd /d "%~dp0"
set "SONAR_RUNTIME=C:\Program Files\WindowsApps\OpenAI.CodexPrimaryRuntime.v26-1030-493-0_26.1030.493.0_x64__3k8sg7r9htsxt\dependencies"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%SONAR_RUNTIME%\node\bin\node.exe" (
    set "PATH=%SONAR_RUNTIME%\node\bin;%PATH%"
  ) else (
    echo Install Node.js 24 LTS, then run this file again.
    pause
    exit /b 1
  )
)
if not exist "node_modules\vite\bin\vite.js" (
  where pnpm >nul 2>nul
  if errorlevel 1 (
    if exist "%SONAR_RUNTIME%\bin\fallback\pnpm.cmd" (
      call "%SONAR_RUNTIME%\bin\fallback\pnpm.cmd" install --frozen-lockfile
    ) else (
      echo Run: npm install -g pnpm@11.25.0
      echo Then run this file again.
      pause
      exit /b 1
    )
  ) else (
    call pnpm install --frozen-lockfile
  )
  if errorlevel 1 (
    echo Dependency installation failed. Check the message above.
    pause
    exit /b 1
  )
)
echo SONAR is starting. Keep this window open.
echo Use the Local URL shown below. Press Ctrl+C to stop.
node node_modules\vite\bin\vite.js --host 127.0.0.1 --open
pause
