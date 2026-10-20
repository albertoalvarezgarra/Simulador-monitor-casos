# ==============================================================================
# SERVIDOR HTTP LOCAL PARA EL SIMULADOR PHILIPS DFM100
# ==============================================================================

$port = 8080
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Detectar IP local real en la red WiFi / LAN
$wifiOrLan = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    ($_.InterfaceAlias -match 'Wi-Fi|Ethernet|WLAN' -or $_.IPAddress -match '^(192\.168\.|10\.|172\.)') -and 
    $_.InterfaceAlias -notmatch 'Loopback|vEthernet|Virtual|Host-Only|HotspotShield|Tap|Tun' -and 
    $_.IPAddress -notmatch '^(169\.|100\.)'
} | Select-Object -First 1

$localIp = if ($wifiOrLan) { $wifiOrLan.IPAddress } else { "192.168.1.201" }

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "   SIMULADOR CLINICO PHILIPS EFFICIA DFM100 INICIADO CON EXITO" -ForegroundColor Green
Write-Host "             Propiedad de Alberto A. Garra" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [PC - INSTRUCTOR]:" -ForegroundColor White
Write-Host "      http://localhost:$port/instructor.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [TABLET - ALUMNO] (en la misma red WiFi):" -ForegroundColor White
Write-Host "      http://${localIp}:$port/student.html" -ForegroundColor Green
Write-Host ""
Write-Host "  [VISTA DUAL EN PC]:" -ForegroundColor Gray
Write-Host "      http://localhost:$port/split-demo.html" -ForegroundColor Yellow
Write-Host ""
Write-Host "---------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  PASOS DE VINCULACION:" -ForegroundColor White
Write-Host "  1. En la tablet, abre: http://${localIp}:$port/student.html" -ForegroundColor Gray
Write-Host "  2. Observa el codigo PIN de 4 letras arriba a la derecha en la tablet." -ForegroundColor Gray
Write-Host "  3. En este PC, haz clic en PIN: ---- e introduce ese codigo." -ForegroundColor Gray
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  Presiona Ctrl + C en esta ventana para detener el servidor." -ForegroundColor Gray
Write-Host ""

Start-Process "http://localhost:$port/instructor.html"

# Iniciar HttpListener
$listener = New-Object System.Net.HttpListener
try {
    $listener.Prefixes.Add("http://*:$port/")
    $listener.Start()
} catch {
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Prefixes.Add("http://127.0.0.1:$port/")
    $listener.Start()
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($urlPath)) {
            $urlPath = "index.html"
        }

        $filePath = Join-Path $scriptDir $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = $mimeTypes[$ext]
            if (-not $contentType) { $contentType = "application/octet-stream" }
            $response.ContentType = $contentType
            $response.AddHeader("Access-Control-Allow-Origin", "*")

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {
        break
    }
}
