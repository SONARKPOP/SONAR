@echo off
setlocal
chcp 65001 >nul
set "PYTHONUTF8=1"
cd /d "%~dp0"
set "SONAR_PYTHON=C:\Program Files\WindowsApps\OpenAI.CodexPrimaryRuntime.v26-1030-493-0_26.1030.493.0_x64__3k8sg7r9htsxt\dependencies\python\python.exe"
echo SONAR - YouTube connection check
echo Only recent uploads are collected to a separate review folder.
echo Your public sample data stays unchanged. The entered key is not saved.
if exist "%SONAR_PYTHON%" (
  "%SONAR_PYTHON%" -m collectors.preflight --prompt-key --limit 5
) else (
  py -3 -m collectors.preflight --prompt-key --limit 5
)
if errorlevel 1 echo Check failed. Read the message above.
pause
