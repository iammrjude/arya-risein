$ErrorActionPreference = "Stop"

function Require-Env($Name) {
    if (-not $env:$Name) {
        throw "Missing required environment variable: $Name"
    }
}

Require-Env "STELLAR_ACCOUNT"
Require-Env "STELLAR_RPC_URL"
Require-Env "STELLAR_NETWORK_PASSPHRASE"

$root = Join-Path $PSScriptRoot ".."
Push-Location $root
try {
    cargo test --workspace

    $networkArgs = @("--rpc-url", $env:STELLAR_RPC_URL, "--network-passphrase", $env:STELLAR_NETWORK_PASSPHRASE)
    $sourceArgs = @("--source-account", $env:STELLAR_ACCOUNT)

    $contracts = @(
        @{ Name = "arya_registry"; Path = "target/wasm32v1-none/release/arya_registry.wasm"; Id = $env:ARYA_EXISTING_REGISTRY_ID },
        @{ Name = "arya_staking"; Path = "target/wasm32v1-none/release/arya_staking.wasm"; Id = $env:ARYA_EXISTING_STAKING_ID },
        @{ Name = "arya_crowdfunding"; Path = "target/wasm32v1-none/release/arya_crowdfunding.wasm"; Id = $env:ARYA_EXISTING_CROWDFUNDING_ID },
        @{ Name = "arya_launchpad"; Path = "target/wasm32v1-none/release/arya_launchpad.wasm"; Id = $env:ARYA_EXISTING_LAUNCHPAD_ID }
    )

    foreach ($contract in $contracts) {
        if (-not $contract.Id) {
            Write-Warning "Skipping $($contract.Name) because no contract id was provided"
            continue
        }

        stellar contract build --package $contract.Name
        $wasmHash = stellar contract upload @sourceArgs @networkArgs --wasm $contract.Path
        stellar contract invoke @sourceArgs @networkArgs --id $contract.Id -- -- upgrade --new-wasm-hash $wasmHash
        Write-Host "Upgraded $($contract.Name) with hash $wasmHash"
    }
}
finally {
    Pop-Location
}
