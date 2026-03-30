$ErrorActionPreference = "Stop"

function Require-Env($Name) {
    if (-not (Get-Item -Path "Env:$Name" -ErrorAction SilentlyContinue)) {
        throw "Missing required environment variable: $Name"
    }
}

function Get-StellarCli() {
    $command = Get-Command stellar -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $cargoHome = if ($env:CARGO_HOME) { $env:CARGO_HOME } else { Join-Path $HOME ".cargo" }
    $fallback = Join-Path $cargoHome "bin/stellar"
    if (Test-Path -LiteralPath $fallback) {
        return $fallback
    }

    throw "Unable to find the 'stellar' CLI. Install stellar-cli or add it to PATH."
}

Require-Env "STELLAR_ACCOUNT"
Require-Env "STELLAR_RPC_URL"
Require-Env "STELLAR_NETWORK_PASSPHRASE"
Require-Env "ARYA_PLATFORM_OWNER"
Require-Env "ARYA_TREASURY"

$root = Join-Path $PSScriptRoot ".."
Push-Location $root
try {
    $stellarCli = Get-StellarCli
    cargo test --workspace

    $networkArgs = @("--rpc-url", $env:STELLAR_RPC_URL, "--network-passphrase", $env:STELLAR_NETWORK_PASSPHRASE)
    $sourceArgs = @("--source-account", $env:STELLAR_ACCOUNT)

    $xlmSac = & $stellarCli contract id asset --asset native @networkArgs

    $contracts = @(
        @{ Name = "arya_registry"; Path = "target/wasm32v1-none/release/arya_registry.wasm"; Alias = "arya-registry" },
        @{ Name = "arya_staking"; Path = "target/wasm32v1-none/release/arya_staking.wasm"; Alias = "arya-staking" },
        @{ Name = "arya_crowdfunding"; Path = "target/wasm32v1-none/release/arya_crowdfunding.wasm"; Alias = "arya-crowdfunding" },
        @{ Name = "arya_launchpad"; Path = "target/wasm32v1-none/release/arya_launchpad.wasm"; Alias = "arya-launchpad" }
    )

    foreach ($contract in $contracts) {
        & $stellarCli contract build --package $contract.Name
        $id = & $stellarCli contract deploy @sourceArgs @networkArgs --wasm $contract.Path --alias $contract.Alias
        Write-Host "$($contract.Name) => $id"
    }

    Write-Host "Native XLM SAC => $xlmSac"
    Write-Host "Deploy completed. Follow docs/MIGRATIONS.md to initialize and register addresses."
}
finally {
    Pop-Location
}
