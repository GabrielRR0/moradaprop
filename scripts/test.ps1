# Corre los tests. Uso:
#   .\scripts\test.ps1               -> todos
#   .\scripts\test.ps1 api           -> solo la API
#   .\scripts\test.ps1 web           -> solo la web
#   .\scripts\test.ps1 module auth   -> solo un modulo de la API
#   .\scripts\test.ps1 e2e           -> end-to-end de la API
param([string]$Target = "all", [string]$Name = "")

Set-Location (Join-Path $PSScriptRoot "..")

switch ($Target) {
  "all"    { pnpm test }
  "api"    { pnpm test:api }
  "web"    { pnpm test:web }
  "e2e"    { pnpm test:e2e }
  "module" {
    if (-not $Name) { Write-Host "Uso: .\scripts\test.ps1 module <nombre>"; exit 1 }
    pnpm test:module $Name
  }
  default { Write-Host "Opciones: all | api | web | e2e | module <nombre>"; exit 1 }
}
