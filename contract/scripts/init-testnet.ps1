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
Require-Env "ARYA_TOKEN_SAC_ID"
Require-Env "ARYA_USDC_SAC_ID"
Require-Env "ARYA_REGISTRY_ID"
Require-Env "ARYA_STAKING_ID"
Require-Env "ARYA_CROWDFUNDING_ID"
Require-Env "ARYA_LAUNCHPAD_ID"

$root = Join-Path $PSScriptRoot ".."
$registryConfigPath = $null
Push-Location $root
try {
    $stellarCli = Get-StellarCli
    $networkArgs = @("--rpc-url", $env:STELLAR_RPC_URL, "--network-passphrase", $env:STELLAR_NETWORK_PASSPHRASE)
    $sourceArgs = @("--source-account", $env:STELLAR_ACCOUNT)
    $xlmSac = if ($env:ARYA_XLM_SAC_ID) {
        $env:ARYA_XLM_SAC_ID
    } else {
        & $stellarCli contract id asset --asset native @networkArgs
    }

    $registryConfigPath = Join-Path ([System.IO.Path]::GetTempPath()) "arya-registry-config.json"
    @"
{
  "owner": "$($env:ARYA_PLATFORM_OWNER)",
  "treasury": "$($env:ARYA_TREASURY)",
  "arya_token": "$($env:ARYA_TOKEN_SAC_ID)",
  "xlm_token": "$xlmSac",
  "usdc_token": "$($env:ARYA_USDC_SAC_ID)",
  "staking_contract": "$($env:ARYA_STAKING_ID)",
  "crowdfunding_contract": "$($env:ARYA_CROWDFUNDING_ID)",
  "launchpad_contract": "$($env:ARYA_LAUNCHPAD_ID)"
}
"@ | Set-Content -LiteralPath $registryConfigPath -Encoding UTF8

    & $stellarCli contract invoke @sourceArgs @networkArgs --id $env:ARYA_REGISTRY_ID -- `
      initialize `
      --config-file-path $registryConfigPath

    & $stellarCli contract invoke @sourceArgs @networkArgs --id $env:ARYA_STAKING_ID -- `
      initialize `
      --owner $env:ARYA_PLATFORM_OWNER `
      --stake-token $env:ARYA_TOKEN_SAC_ID `
      --xlm-reward-token $xlmSac `
      --usdc-reward-token $env:ARYA_USDC_SAC_ID `
      --min-lockup-days 7

    & $stellarCli contract invoke @sourceArgs @networkArgs --id $env:ARYA_CROWDFUNDING_ID -- `
      initialize `
      --owner $env:ARYA_PLATFORM_OWNER `
      --treasury-wallet $env:ARYA_TREASURY `
      --staking-contract $env:ARYA_STAKING_ID `
      --xlm-token $xlmSac `
      --usdc-token $env:ARYA_USDC_SAC_ID `
      --fee-basis-points 250 `
      --staking-share-basis-points 5000 `
      --action-window-days 7

    & $stellarCli contract invoke @sourceArgs @networkArgs --id $env:ARYA_LAUNCHPAD_ID -- `
      initialize `
      --owner $env:ARYA_PLATFORM_OWNER `
      --treasury-wallet $env:ARYA_TREASURY `
      --staking-contract $env:ARYA_STAKING_ID `
      --xlm-token $xlmSac `
      --usdc-token $env:ARYA_USDC_SAC_ID `
      --fee-basis-points 300 `
      --staking-share-basis-points 5000

    Write-Host "Registry initialized => $($env:ARYA_REGISTRY_ID)"
    Write-Host "Staking initialized => $($env:ARYA_STAKING_ID)"
    Write-Host "Crowdfunding initialized => $($env:ARYA_CROWDFUNDING_ID)"
    Write-Host "Launchpad initialized => $($env:ARYA_LAUNCHPAD_ID)"
    Write-Host "XLM SAC => $xlmSac"
}
finally {
    if ($registryConfigPath -and (Test-Path -LiteralPath $registryConfigPath)) {
        Remove-Item -LiteralPath $registryConfigPath -Force
    }
    Pop-Location
}
