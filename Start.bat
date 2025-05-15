@echo off
setlocal
cd /d %~dp0netdis_main\
echo %~dp0netdis_main\ > "folder" 2>&1
set "NODE_PATH=%~dp0netdis_main\bin"
set "PATH=%NODE_PATH%;%PATH%"
start /b cmd /c "%~dp0netdis_main\bin\npm run start > %~dp0netdis_main\logs\log_start.log 2>&1" > testStart 2>&1
exit