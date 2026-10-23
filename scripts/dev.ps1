# Levanta el proyecto. Uso:
#   .\scripts\dev.ps1            -> todo (db, redis, mailpit, api, web)
#   .\scripts\dev.ps1 api        -> solo la API (y sus dependencias: db, install)
#   .\scripts\dev.ps1 web        -> solo la web
#   .\scripts\dev.ps1 db         -> solo db + redis + mailpit
#   .\scripts\dev.ps1 stop       -> detiene todo
param([string]$Target = "all")

Set-Location (Join-Path $PSScriptRoot "..")

switch ($Target) {
  "all"  { docker compose up }
  "api"  { docker compose up api }
  "web"  { docker compose up web }
  "db"   { docker compose up db redis mailpit }
  "stop" { docker compose down }
  default { Write-Host "Opciones: all | api | web | db | stop"; exit 1 }
}
