#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

packages=(
  arya_registry
  arya_staking
  arya_crowdfunding
  arya_launchpad
)

for package in "${packages[@]}"; do
  stellar contract build --package "$package"
done
