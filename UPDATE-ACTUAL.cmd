@echo off
setlocal
chcp 65001 >nul
set "PYTHONUTF8=1"
cd /d "%~dp0"
set "SONAR_PYTHON=C:\Program Files\WindowsApps\OpenAI.CodexPrimaryRuntime.v26-1030-493-0_26.1030.493.0_x64__3k8sg7r9htsxt\dependencies\python\python.exe"
echo SONAR - Update actual videos for priority groups
echo Previous actual videos are retained. Samples are excluded.
echo Your key is hidden and not saved.
if exist "%SONAR_PYTHON%" (
  "%SONAR_PYTHON%" -m collectors.update_actual --prompt-key --limit 10
) else (
  py -3 -m collectors.update_actual --prompt-key --limit 10
)
if errorlevel 1 echo Update failed. Check the message above.
pause
