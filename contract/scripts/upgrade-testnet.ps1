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

$root = Join-Path $PSScriptRoot ".."
Push-Location $root
try {
    $stellarCli = Get-StellarCli
    cargo test --workspace

    $networkArgs = @("--rpc-url", $env:STELLAR_RPC_URL, "--network-passphrase", $env:STELLAR_NETWORK_PASSPHRASE)
    $sourceArgs = @("--source-account", $env:STELLAR_ACCOUNT)

    $contracts = @(
        @{ Name = "arya_registry"; Path = "target/wasm32v1-none/release/arya_registry.wasm"; Id = $env:ARYA_REGISTRY_ID },
        @{ Name = "arya_staking"; Path = "target/wasm32v1-none/release/arya_staking.wasm"; Id = $env:ARYA_STAKING_ID },
        @{ Name = "arya_crowdfunding"; Path = "target/wasm32v1-none/release/arya_crowdfunding.wasm"; Id = $env:ARYA_CROWDFUNDING_ID },
        @{ Name = "arya_launchpad"; Path = "target/wasm32v1-none/release/arya_launchpad.wasm"; Id = $env:ARYA_LAUNCHPAD_ID }
    )

    foreach ($contract in $contracts) {
        if (-not $contract.Id) {
            Write-Warning "Skipping $($contract.Name) because no contract id was provided"
            continue
        }

        & $stellarCli contract build --package $contract.Name
        $wasmHash = & $stellarCli contract upload @sourceArgs @networkArgs --wasm $contract.Path
        & $stellarCli contract invoke @sourceArgs @networkArgs --id $contract.Id -- -- upgrade --new-wasm-hash $wasmHash
        Write-Host "Upgraded $($contract.Name) with hash $wasmHash"
    }
}
finally {
    Pop-Location
}
