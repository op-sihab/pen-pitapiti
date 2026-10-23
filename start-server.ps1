$dir = (Get-Item .).FullName
$cmd = "node `"$dir\server.js`""
$res = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = $cmd
    CurrentDirectory = $dir
}
Write-Host "Started PID:" $res.ProcessId
Start-Sleep -Seconds 5
netstat -ano | findstr :3000
