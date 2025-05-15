Dim shell, fso, scriptPath, batPath

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Récupérer le chemin du script VBS
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Construire le chemin du fichier Start.bat
batPath = fso.BuildPath(scriptPath, "..\..\Start.bat")

' Lancer le fichier BAT en mode caché
shell.Run """" & batPath & """", 0, False
