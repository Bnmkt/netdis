@echo off
setlocal
cd ..
set "NODE_PATH=%~dp0\bin\node"
set "PATH=%NODE_PATH%;%PATH%"
%NODE_PATH%\node.exe %~dp0\bin\npm %*
npm run stop > logs\log_stop.log 2>&1
endlocal
