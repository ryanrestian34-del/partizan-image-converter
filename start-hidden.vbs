Set WshShell = CreateObject("WScript.Shell")

WshShell.Run "powershell -windowstyle hidden -command ""cd 'C:\face-converter'; npm run dev""", 0

WScript.Sleep 8000

WshShell.Run "http://localhost:3000"