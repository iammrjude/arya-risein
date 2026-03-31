#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

require_env STELLAR_ACCOUNT
require_env STELLAR_RPC_URL
require_env STELLAR_NETWORK_PASSPHRASE

NETWORK_ARGS=(--rpc-url "$STELLAR_RPC_URL" --network-passphrase "$STELLAR_NETWORK_PASSPHRASE")
SOURCE_ARGS=(--source-account "$STELLAR_ACCOUNT")
XLM_ASSET="${ARYA_XLM_ASSET:-native}"
USDC_ASSET="${ARYA_USDC_ASSET:-USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5}"
XLM_SAC_ID="${ARYA_XLM_SAC_ID:-$(stellar contract id asset --asset native "${NETWORK_ARGS[@]}")}"

resolve_arya_token_asset() {
  local issuer="${ARYA_TOKEN_ISSUER:-$ARYA_PLATFORM_OWNER}"
  echo "${ARYA_TOKEN_ASSET:-ARYA:${issuer}}"
}

require_known_arya_token_asset() {
  if [[ -n "${ARYA_TOKEN_SAC_ID:-}" && -z "${ARYA_TOKEN_ASSET:-}" && -z "${ARYA_TOKEN_ISSUER:-}" ]]; then
    echo "Missing ARYA_TOKEN_ASSET or ARYA_TOKEN_ISSUER for the provided ARYA_TOKEN_SAC_ID." >&2
    echo "Set one of them so the workflow can persist the correct ARYA asset string." >&2
    exit 1
  fi
}

ensure_arya_token_sac_id() {
  if [[ -n "${ARYA_TOKEN_SAC_ID:-}" ]]; then
    echo "$ARYA_TOKEN_SAC_ID"
    return
  fi

  local asset
  asset="$(resolve_arya_token_asset)"

  echo "ARYA_TOKEN_SAC_ID not set. Deploying ARYA token asset contract for $asset." >&2
  stellar contract asset deploy "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --asset "$asset" --alias arya-token
}

build_packages() {
  bash scripts/build-all.sh
}

deploy_suite() {
  require_env ARYA_PLATFORM_OWNER
  require_env ARYA_TREASURY
  require_env ARYA_USDC_SAC_ID
  require_known_arya_token_asset

  echo "No persisted contract IDs found. Running first-time deployment."

  local registry_id
  local staking_id
  local crowdfunding_id
  local launchpad_id
  local arya_token_sac_id

  arya_token_sac_id="$(ensure_arya_token_sac_id)"

  registry_id="$(stellar contract deploy "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --wasm target/wasm32v1-none/release/arya_registry.wasm --alias arya-registry)"
  staking_id="$(stellar contract deploy "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --wasm target/wasm32v1-none/release/arya_staking.wasm --alias arya-staking)"
  crowdfunding_id="$(stellar contract deploy "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --wasm target/wasm32v1-none/release/arya_crowdfunding.wasm --alias arya-crowdfunding)"
  launchpad_id="$(stellar contract deploy "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --wasm target/wasm32v1-none/release/arya_launchpad.wasm --alias arya-launchpad)"

  local registry_config
  registry_config="$(mktemp)"
  cat > "$registry_config" <<EOF
{
  "owner": "$ARYA_PLATFORM_OWNER",
  "treasury": "$ARYA_TREASURY",
  "arya_token": "$arya_token_sac_id",
  "xlm_token": "$XLM_SAC_ID",
  "usdc_token": "$ARYA_USDC_SAC_ID",
  "staking_contract": "$staking_id",
  "crowdfunding_contract": "$crowdfunding_id",
  "launchpad_contract": "$launchpad_id"
}
EOF

  stellar contract invoke "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --id "$registry_id" -- initialize --config-file-path "$registry_config"
  stellar contract invoke "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --id "$staking_id" -- initialize --owner "$ARYA_PLATFORM_OWNER" --stake-token "$arya_token_sac_id" --xlm-reward-token "$XLM_SAC_ID" --usdc-reward-token "$ARYA_USDC_SAC_ID" --min-lockup-days 7
  stellar contract invoke "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --id "$crowdfunding_id" -- initialize --owner "$ARYA_PLATFORM_OWNER" --treasury-wallet "$ARYA_TREASURY" --staking-contract "$staking_id" --xlm-token "$XLM_SAC_ID" --usdc-token "$ARYA_USDC_SAC_ID" --fee-basis-points 250 --staking-share-basis-points 5000 --action-window-days 7
  stellar contract invoke "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --id "$launchpad_id" -- initialize --owner "$ARYA_PLATFORM_OWNER" --treasury-wallet "$ARYA_TREASURY" --staking-contract "$staking_id" --xlm-token "$XLM_SAC_ID" --usdc-token "$ARYA_USDC_SAC_ID" --fee-basis-points 300 --staking-share-basis-points 5000

  rm -f "$registry_config"

  echo "First-time deployment complete."
  echo "Persist these GitHub Repository Variables for future auto-upgrades:"
  echo "ARYA_REGISTRY_ID=$registry_id"
  echo "ARYA_STAKING_ID=$staking_id"
  echo "ARYA_CROWDFUNDING_ID=$crowdfunding_id"
  echo "ARYA_LAUNCHPAD_ID=$launchpad_id"
  echo "ARYA_TOKEN_ASSET=$(resolve_arya_token_asset)"
  echo "ARYA_TOKEN_SAC_ID=$arya_token_sac_id"
  echo "ARYA_USDC_ASSET=$USDC_ASSET"
  echo "ARYA_USDC_SAC_ID=$ARYA_USDC_SAC_ID"
  echo "ARYA_XLM_ASSET=$XLM_ASSET"
  echo "ARYA_XLM_SAC_ID=$XLM_SAC_ID"
}

upgrade_suite() {
  require_env ARYA_REGISTRY_ID
  require_env ARYA_STAKING_ID
  require_env ARYA_CROWDFUNDING_ID
  require_env ARYA_LAUNCHPAD_ID

  echo "Persisted contract IDs found. Running upgrade flow."

  local registry_hash
  local staking_hash
  local crowdfunding_hash
  local launchpad_hash

  registry_hash="$(stellar contract upload "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --wasm target/wasm32v1-none/release/arya_registry.wasm)"
  staking_hash="$(stellar contract upload "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --wasm target/wasm32v1-none/release/arya_staking.wasm)"
  crowdfunding_hash="$(stellar contract upload "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --wasm target/wasm32v1-none/release/arya_crowdfunding.wasm)"
  launchpad_hash="$(stellar contract upload "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --wasm target/wasm32v1-none/release/arya_launchpad.wasm)"

  stellar contract invoke "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --id "$ARYA_REGISTRY_ID" -- upgrade --new-wasm-hash "$registry_hash"
  stellar contract invoke "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --id "$ARYA_STAKING_ID" -- upgrade --new-wasm-hash "$staking_hash"
  stellar contract invoke "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --id "$ARYA_CROWDFUNDING_ID" -- upgrade --new-wasm-hash "$crowdfunding_hash"
  stellar contract invoke "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --id "$ARYA_LAUNCHPAD_ID" -- upgrade --new-wasm-hash "$launchpad_hash"

  echo "Upgrade complete."
}

cargo test --workspace
build_packages

if [[ -n "${ARYA_REGISTRY_ID:-}" ]]; then
  upgrade_suite
else
  deploy_suite
fi
