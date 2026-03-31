# Upgrade Guide

The new Arya contracts are upgradeable and expose:

- `upgrade(new_wasm_hash: BytesN<32>)`

Contracts covered:

- `arya_registry`
- `arya_staking`
- `arya_crowdfunding`
- `arya_launchpad`

## Safe Testnet Upgrade Flow

1. change code
2. run lint, tests, and Wasm build locally
3. upload the new Wasm
4. invoke the contract’s `upgrade` function
5. verify read methods
6. update frontend env only if contract IDs changed

## Local Validation Before Upgrade

```bash
cd contract
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo test --workspace
```

Then:

```powershell
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File scripts/build-all.ps1
```

## Automated Upgrade Script

Required env vars:

- `STELLAR_ACCOUNT`
- `STELLAR_RPC_URL`
- `STELLAR_NETWORK_PASSPHRASE`
- `ARYA_REGISTRY_ID`
- `ARYA_STAKING_ID`
- `ARYA_CROWDFUNDING_ID`
- `ARYA_LAUNCHPAD_ID`

Run:

```powershell
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File contract/scripts/upgrade-testnet.ps1
```

The script:

- rebuilds the contracts
- uploads new Wasm hashes
- invokes `upgrade` on each provided deployed contract

## Manual Upgrade Example

Upload Wasm:

```bash
stellar contract upload \
  --source-account arya-admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --wasm target/wasm32v1-none/release/arya_staking.wasm
```

Invoke upgrade:

```bash
stellar contract invoke \
  --source-account arya-admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --id YOUR_STAKING_ID \
  -- \
  upgrade \
  --new-wasm-hash WASM_HASH
```

## Post-Upgrade Verification

Registry:

```bash
stellar contract invoke --id YOUR_REGISTRY_ID -- get_config
```

Staking:

```bash
stellar contract invoke --id YOUR_STAKING_ID -- get_settings
```

Crowdfunding:

```bash
stellar contract invoke --id YOUR_CROWDFUNDING_ID -- get_platform_settings
```

Launchpad:

```bash
stellar contract invoke --id YOUR_LAUNCHPAD_ID -- get_platform_settings
```

## Frontend After Upgrade

If the contract IDs did not change, the frontend config usually stays the same.

If you redeployed instead of upgrading, update:

- `VITE_REGISTRY_CONTRACT_ID`
- `VITE_CROWDFUNDING_CONTRACT_ID`
- `VITE_STAKING_CONTRACT_ID`
- `VITE_LAUNCHPAD_CONTRACT_ID`

Then rebuild and redeploy the frontend.
