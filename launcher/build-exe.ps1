# Builds ClinicAppointmentSystem.exe, a small Windows launcher that opens the
# hosted clinic application in its own window.
#
# Usage (PowerShell, in the clinic-management folder):
#   powershell -ExecutionPolicy Bypass -File launcher\build-exe.ps1 -Url https://your-app.vercel.app
#
# Uses the C# compiler that is part of Windows (.NET Framework 4), so nothing
# needs to be installed. The .exe is written to launcher\dist\.
param(
  [Parameter(Mandatory = $true)][string]$Url
)
$ErrorActionPreference = "Stop"

if ($Url -notmatch '^https?://[A-Za-z0-9.\-]+(:\d+)?(/[^\s"]*)?$') {
  throw "Give the full address, for example https://your-app.vercel.app"
}

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$csc = Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) { $csc = Join-Path $env:WINDIR "Microsoft.NET\Framework\v4.0.30319\csc.exe" }
if (-not (Test-Path $csc)) { throw "C# compiler not found (.NET Framework 4 is needed)" }

$dist = Join-Path $here "dist"
New-Item -ItemType Directory -Force $dist | Out-Null
$source = Join-Path $dist "ClinicApp.generated.cs"
$exe = Join-Path $dist "ClinicAppointmentSystem.exe"

(Get-Content (Join-Path $here "ClinicApp.cs") -Raw).Replace("__APP_URL__", $Url) | Set-Content $source -Encoding UTF8

& $csc /nologo /target:winexe /optimize+ "/win32icon:$(Join-Path $here 'clinic.ico')" /reference:System.Windows.Forms.dll "/out:$exe" $source
if ($LASTEXITCODE -ne 0) { throw "Compilation failed" }
Remove-Item $source

$size = [math]::Round((Get-Item $exe).Length / 1KB, 1)
Write-Host "Built $exe ($size KB) -> opens $Url"
