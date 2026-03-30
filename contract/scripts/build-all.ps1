$ErrorActionPreference = "Stop"

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

Push-Location (Join-Path $PSScriptRoot "..")
try {
    $stellarCli = Get-StellarCli
    $packages = @(
        "arya_registry",
        "arya_staking",
        "arya_crowdfunding",
        "arya_launchpad"
    )

    foreach ($package in $packages) {
        & $stellarCli contract build --package $package
    }
}
finally {
    Pop-Location
}
