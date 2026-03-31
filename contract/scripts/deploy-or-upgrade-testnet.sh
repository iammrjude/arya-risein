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

hash_file() {
  local file_path="$1"

  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file_path" | awk '{print $1}'
  else
    shasum -a 256 "$file_path" | awk '{print $1}'
  fi
}

upgrade_if_wasm_changed() {
  local contract_name="$1"
  local contract_id="$2"
  local wasm_path="$3"
  local deployed_wasm
  local local_hash
  local deployed_hash
  local wasm_hash

  deployed_wasm="$(mktemp)"

  stellar contract fetch --id "$contract_id" "${NETWORK_ARGS[@]}" --out-file "$deployed_wasm"

  local_hash="$(hash_file "$wasm_path")"
  deployed_hash="$(hash_file "$deployed_wasm")"

  if [[ "$local_hash" == "$deployed_hash" ]]; then
    echo "INFO: Skipping $contract_name upgrade because deployed Wasm matches local build ($local_hash)."
    rm -f "$deployed_wasm"
    return 1
  fi

  echo "INFO: $contract_name Wasm changed: deployed=$deployed_hash local=$local_hash"
  wasm_hash="$(stellar contract upload "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --wasm "$wasm_path")"
  stellar contract invoke "${SOURCE_ARGS[@]}" "${NETWORK_ARGS[@]}" --id "$contract_id" -- upgrade --new-wasm-hash "$wasm_hash"

  rm -f "$deployed_wasm"
  return 0
}

print_upgrade_summary() {
  local upgraded_count="${#UPGRADED_CONTRACTS[@]}"
  local skipped_count="${#SKIPPED_CONTRACTS[@]}"

  echo "Upgrade summary: ${upgraded_count}/4 contracts upgraded."

  if (( upgraded_count > 0 )); then
    echo "Upgraded contracts: ${UPGRADED_CONTRACTS[*]}"
  else
    echo "Upgraded contracts: none"
  fi

  if (( skipped_count > 0 )); then
    echo "Skipped contracts: ${SKIPPED_CONTRACTS[*]}"
  else
    echo "Skipped contracts: none"
  fi
}

track_upgrade() {
  local contract_name="$1"
  local contract_id="$2"
  local wasm_path="$3"

  if upgrade_if_wasm_changed "$contract_name" "$contract_id" "$wasm_path"; then
    UPGRADED_CONTRACTS+=("$contract_name")
    return 0
  fi

  SKIPPED_CONTRACTS+=("$contract_name")
  return 0
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

  UPGRADED_CONTRACTS=()
  SKIPPED_CONTRACTS=()

  echo "Persisted contract IDs found. Running upgrade flow."

  track_upgrade "arya_registry" "$ARYA_REGISTRY_ID" "target/wasm32v1-none/release/arya_registry.wasm"
  track_upgrade "arya_staking" "$ARYA_STAKING_ID" "target/wasm32v1-none/release/arya_staking.wasm"
  track_upgrade "arya_crowdfunding" "$ARYA_CROWDFUNDING_ID" "target/wasm32v1-none/release/arya_crowdfunding.wasm"
  track_upgrade "arya_launchpad" "$ARYA_LAUNCHPAD_ID" "target/wasm32v1-none/release/arya_launchpad.wasm"

  print_upgrade_summary
  echo "Upgrade complete."
}

cargo test --workspace
build_packages

if [[ -n "${ARYA_REGISTRY_ID:-}" ]]; then
  upgrade_suite
else
  deploy_suite
fi
