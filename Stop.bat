@echo off
setlocal
set "NODE_PATH=%~dp0netdis_main\bin"
set "PATH=%NODE_PATH%;%PATH%"
start "" cmd /c "%~dp0netdis_main\bin\npm run stop > %~dp0netdis_main\logs\log_stop.log 2>&1"
pause
exit