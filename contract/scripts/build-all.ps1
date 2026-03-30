$ErrorActionPreference = "Stop"

Push-Location (Join-Path $PSScriptRoot "..")
try {
    $packages = @(
        "arya_registry",
        "arya_staking",
        "arya_crowdfunding",
        "arya_launchpad"
    )

    foreach ($package in $packages) {
        stellar contract build --package $package
    }
}
finally {
    Pop-Location
}
