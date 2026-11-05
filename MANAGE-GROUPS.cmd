@echo off
setlocal
chcp 65001 >nul
set "PYTHONUTF8=1"
cd /d "%~dp0"
set "SONAR_PYTHON=C:\Program Files\WindowsApps\OpenAI.CodexPrimaryRuntime.v26-1030-493-0_26.1030.493.0_x64__3k8sg7r9htsxt\dependencies\python\python.exe"
if exist "%SONAR_PYTHON%" (
  "%SONAR_PYTHON%" -m collectors.groups wizard
) else (
  py -3 -m collectors.groups wizard
)
if errorlevel 1 echo Registration failed. Check Python 3.12+ and the message above.
pause
