@echo off
setlocal
set "NODE_PATH=%~dp0"
set "PATH=%NODE_PATH%;%PATH%"
"%NODE_PATH%node.exe" "%~dp0npm" run start > "%~dp0\..\logs\log_start.log" 2>&1
endlocal
pause