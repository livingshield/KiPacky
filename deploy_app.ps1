$localConfigPath = Join-Path $PSScriptRoot "appsettings.local.json"
if (-not (Test-Path $localConfigPath)) {
    $localConfigPath = Join-Path $PSScriptRoot "backend\appsettings.local.json"
}
if (Test-Path $localConfigPath) {
    $cfg = Get-Content $localConfigPath -Raw | ConvertFrom-Json
    $ftpHost = $cfg.FTP.Host
    $user = $cfg.FTP.Username
    $pass = $cfg.FTP.Password
} else {
    $ftpHost = if ($env:FTP_HOST) { $env:FTP_HOST } else { "YOUR_FTP_HOST" }
    $user = if ($env:FTP_USER) { $env:FTP_USER } else { "YOUR_FTP_USER" }
    $pass = if ($env:FTP_PASS) { $env:FTP_PASS } else { "YOUR_FTP_PASSWORD" }
}
$baseFtp = "ftp://$ftpHost/www/apps/Kipacky"

function Upload-File($localFile, $remoteRel) {
    if ($localFile -like "*.exe*" -or $remoteRel -like "*.exe*") {
        throw "Security violation: .exe files strictly forbidden on ASPONE FTP!"
    }
    $url = "$baseFtp/" + $remoteRel.TrimStart('/')
    Write-Host "Uploading $remoteRel to $url ..."
    $req = [System.Net.FtpWebRequest]::Create($url)
    $req.Credentials = New-Object System.Net.NetworkCredential($user, $pass)
    $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $bytes = [System.IO.File]::ReadAllBytes($localFile)
    $req.ContentLength = $bytes.Length
    $stream = $req.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    $resp = $req.GetResponse()
    $resp.Close()
    Write-Host "Uploaded: $remoteRel" -ForegroundColor Green
}

function Ensure-FtpDir($dirRel) {
    $url = "$baseFtp/" + $dirRel.TrimStart('/')
    try {
        $req = [System.Net.FtpWebRequest]::Create($url)
        $req.Credentials = New-Object System.Net.NetworkCredential($user, $pass)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $resp = $req.GetResponse()
        $resp.Close()
        Write-Host "Created directory: $dirRel" -ForegroundColor DarkGray
    } catch {
        # already exists
    }
}

# 1. Upload API handler (with connection string injection from local config)
$apiContent = [System.IO.File]::ReadAllText("C:\Users\janky\.gemini\antigravity\scratch\Kipacky\api.ashx")
if ($cfg -and $cfg.ConnectionStrings.ProductionConnection) {
    $apiContent = $apiContent.Replace("Server=YOUR_SERVER;Database=YOUR_DATABASE;User Id=YOUR_USER;Password=YOUR_PASSWORD;Encrypt=False", $cfg.ConnectionStrings.ProductionConnection)
}
$tempApi = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllText($tempApi, $apiContent, (New-Object System.Text.UTF8Encoding($true)))
Upload-File $tempApi "api.ashx"
Remove-Item $tempApi -Force -ErrorAction SilentlyContinue

# 2. Upload all root files from backend/wwwroot (excluding .exe)
Get-ChildItem -Path "C:\Users\janky\.gemini\antigravity\scratch\Kipacky\backend\wwwroot" -File | Where-Object { $_.Extension -ne ".exe" } | ForEach-Object {
    Upload-File $_.FullName $_.Name
}

# 3. Ensure assets directory exists and upload all assets
Ensure-FtpDir "assets"
Get-ChildItem -Path "C:\Users\janky\.gemini\antigravity\scratch\Kipacky\backend\wwwroot\assets" -File | Where-Object { $_.Extension -ne ".exe" } | ForEach-Object {
    Upload-File $_.FullName ("assets/" + $_.Name)
}

Write-Host "=== All files successfully deployed to FTP! ===" -ForegroundColor Cyan
