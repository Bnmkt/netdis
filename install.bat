@echo off
setlocal
net session >nul 2>&1
if %errorLevel% == 0 (
   echo Le script est exécuté avec des privilèges d'administrateur.
) else (
   echo Ce script nécessite des privilèges d'administrateur.
   pause
   exit /b 1
)

:: Définition du répertoire du script
set "scriptDir=%~dp0netdis_main/"
cd /d "%scriptDir%"

set "NODE_PATH=%~dp0bin"
set "PATH=%NODE_PATH%;%PATH%"

:: Installation des paquets npm
echo Installation en cours...
call "%scriptDir%bin\npm" "install"
call "%scriptDir%bin\npm" "rebuild"



:: Création de la tâche planifiée
echo Création de la tache planifiée...
::schtasks /create /tn "NetDis" /tr "%scriptDir%bin/netdis_windows.vbs" /sc ONLOGON /rl LIMITED /f

:: Lancement de l'application
echo Lancement de l'application..., ne fermez pas le nouveau terminal
timeout /t 3 > NUL
start "" "%scriptDir%bin/netdis_windows.vbs"
timeout /t 3 > NUL

:: Ouvrir un README et une page web
:: start notepad "%scriptDir%README.md"
::start http://127.0.0.1:8422/readme

echo "Installation terminée ! Appuez sur n'importe quelle touche pour terminer"
pause
exit