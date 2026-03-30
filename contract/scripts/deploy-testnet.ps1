$ErrorActionPreference = "Stop"

function Require-Env($Name) {
    if (-not (Get-Item -Path "Env:$Name" -ErrorAction SilentlyContinue)) {
        throw "Missing required environment variable: $Name"
    }
}

Require-Env "STELLAR_ACCOUNT"
Require-Env "STELLAR_RPC_URL"
Require-Env "STELLAR_NETWORK_PASSPHRASE"
Require-Env "ARYA_PLATFORM_OWNER"
Require-Env "ARYA_TREASURY"

$root = Join-Path $PSScriptRoot ".."
Push-Location $root
try {
    cargo test --workspace

    $networkArgs = @("--rpc-url", $env:STELLAR_RPC_URL, "--network-passphrase", $env:STELLAR_NETWORK_PASSPHRASE)
    $sourceArgs = @("--source-account", $env:STELLAR_ACCOUNT)

    $xlmSac = stellar contract id asset --asset native @networkArgs

    $contracts = @(
        @{ Name = "arya_registry"; Path = "target/wasm32v1-none/release/arya_registry.wasm"; Alias = "arya-registry" },
        @{ Name = "arya_staking"; Path = "target/wasm32v1-none/release/arya_staking.wasm"; Alias = "arya-staking" },
        @{ Name = "arya_crowdfunding"; Path = "target/wasm32v1-none/release/arya_crowdfunding.wasm"; Alias = "arya-crowdfunding" },
        @{ Name = "arya_launchpad"; Path = "target/wasm32v1-none/release/arya_launchpad.wasm"; Alias = "arya-launchpad" }
    )

    foreach ($contract in $contracts) {
        stellar contract build --package $contract.Name
        $id = stellar contract deploy @sourceArgs @networkArgs --wasm $contract.Path --alias $contract.Alias
        Write-Host "$($contract.Name) => $id"
    }

    Write-Host "Native XLM SAC => $xlmSac"
    Write-Host "Deploy completed. Follow docs/MIGRATIONS.md to initialize and register addresses."
}
finally {
    Pop-Location
}
