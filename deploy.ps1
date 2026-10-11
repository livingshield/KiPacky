# ==============================================================================
# Nasazovací skript pro ASPONE Hosting (windows11.aspone.cz)
# ==============================================================================
# DŮLEŽITÉ BEZPEČNOSTNÍ PRAVIDLO ASPONE:
# Na FTP server je PŘÍSNĚ ZAKÁZÁNO nahrávat jakékoliv .exe soubory.
# ==============================================================================

param(
    [switch]$SkipBuild = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

$localConfigPath = Join-Path $PSScriptRoot "appsettings.local.json"
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
$targetPath = "www/Kipacky"

Write-Host "=== Začátek nasazovacího procesu pro Kipacky ===" -ForegroundColor Cyan

# 1. Build & Publish (pokud není přeskočeno)
if (-not $SkipBuild) {
    Write-Host "1. Sestavuji React frontend..." -ForegroundColor Yellow
    Push-Location "./frontend"
    npm.cmd run build
    Pop-Location

    Write-Host "2. Publikuji .NET backend (s vyloučením .exe)..." -ForegroundColor Yellow
    dotnet publish ./backend/Kipacky.csproj -c Release -o ./publish
}

$publishDir = Resolve-Path "./publish"

# 3. Kontrola bezpečnosti balíčku - absolutní zákaz *.exe souborů
Write-Host "3. Kontroluji nepřítomnost spustitelných souborů (.exe)..." -ForegroundColor Yellow
$forbiddenFiles = Get-ChildItem -Path $publishDir -Recurse | Where-Object { 
    $_.Name -like "*.exe*" -or $_.Extension -eq ".exe"
}

if ($forbiddenFiles.Count -gt 0) {
    Write-Error "KRITICKÁ CHYBA: Nalezeny zakázané soubory pro ASPONE hosting:`n$($forbiddenFiles.FullName -join "`n")"
    exit 1
}
Write-Host "-> Bezpečnostní kontrola úspěšná: Žádné .exe soubory nebyly nalezeny." -ForegroundColor Green

if ($DryRun) {
    Write-Host "Režim simulace (DryRun). Žádné soubory nebyly nahrány na FTP." -ForegroundColor Cyan
    exit 0
}

# 4. Funkce pro FTP nahrávání
function Ensure-FTP-Directory($relPath) {
    $fullFtpPath = if ($relPath) { "ftp://$ftpHost/$targetPath/$relPath" } else { "ftp://$ftpHost/$targetPath" }
    try {
        $req = [System.Net.WebRequest]::Create($fullFtpPath)
        $req.Credentials = New-Object System.Net.NetworkCredential($user, $pass)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $resp = $req.GetResponse()
        $resp.Close()
        Write-Host "Vytvořena FTP složka: $relPath" -ForegroundColor DarkGray
    } catch {
        # Složka pravděpodobně již existuje
    }
}

function Upload-FTP-File($localPath, $relPath) {
    # Druhá linie obrany: explicitní zákaz .exe
    if ($localPath -like "*.exe*") {
        Write-Error "POKUS O NAHRÁNÍ EXE SOUBORU ZABLOKOVÁN: $localPath"
        return
    }

    $fullFtpPath = "ftp://$ftpHost/$targetPath/$relPath"
    Write-Host "Nahrávám: $relPath ..." -ForegroundColor Gray
    try {
        $req = [System.Net.WebRequest]::Create($fullFtpPath)
        $req.Credentials = New-Object System.Net.NetworkCredential($user, $pass)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        
        $fileBytes = [System.IO.File]::ReadAllBytes($localPath)
        $req.ContentLength = $fileBytes.Length
        
        $reqStream = $req.GetRequestStream()
        $reqStream.Write($fileBytes, 0, $fileBytes.Length)
        $reqStream.Close()
        
        $resp = $req.GetResponse()
        $resp.Close()
    } catch {
        Write-Error "Chyba při nahrávání $relPath : $_"
    }
}

Write-Host "4. Nahrávám soubory na FTP ASPONE ($targetPath)..." -ForegroundColor Yellow

# Vytvoření kořenového adresáře na FTP
Ensure-FTP-Directory ""

# Procházení a vytvoření všech podadresářů
$allFiles = Get-ChildItem -Path $publishDir -Recurse
$dirs = $allFiles | Where-Object { $_.PSIsContainer } | Sort-Object FullName
foreach ($dir in $dirs) {
    $rel = $dir.FullName.Substring($publishDir.Path.Length + 1).Replace("\", "/")
    Ensure-FTP-Directory $rel
}

# Nahrání souborů (filtrováno proti .exe)
$filesToUpload = $allFiles | Where-Object { 
    !$_.PSIsContainer -and ($_.Extension -ne ".exe") -and ($_.Name -notlike "*.exe*") 
}

foreach ($file in $filesToUpload) {
    $rel = $file.FullName.Substring($publishDir.Path.Length + 1).Replace("\", "/")
    Upload-FTP-File $file.FullName $rel
}

Write-Host "=== Nasazení aplikace Kipacky na ASPONE bylo úspěšně dokončeno! ===" -ForegroundColor Green
