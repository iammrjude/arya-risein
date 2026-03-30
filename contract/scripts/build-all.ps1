$ErrorActionPreference = "Stop"

Push-Location (Join-Path $PSScriptRoot "..")
try {
    cargo test --workspace
}
finally {
    Pop-Location
}
