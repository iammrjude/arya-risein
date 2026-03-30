# Deployment Guide

This guide covers the full Arya testnet deployment flow.

## 1. Prerequisites

- Rust stable installed
- `wasm32v1-none` target installed
- Stellar CLI GitHub Action `stellar/stellar-cli@v23.3.0`
- a funded Stellar testnet identity in the CLI
- ARYA token/SAC available
- USDC SAC available for your test setup

Install the target:

```bash
rustup target add wasm32v1-none
```

Check CLI version:

```bash
stellar --version
```

## 2. Create or Import a CLI Identity

Generate a new one:

```bash
stellar keys generate arya-admin -q
stellar keys use arya-admin
stellar keys public-key arya-admin
```

Or import an existing one:

```bash
stellar keys add arya-admin --secret-key SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
stellar keys use arya-admin
```

Fund it on testnet:

```bash
stellar keys fund arya-admin --network testnet
```

## 3. Configure Testnet

```bash
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

stellar network use testnet
```

## 4. Validate the Workspace

```bash
cd contract
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo test --workspace
```

Build the Wasm packages:

```powershell
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File scripts/build-all.ps1
```

## 5. Set Environment Variables

```powershell
$env:STELLAR_ACCOUNT="arya-admin"
$env:STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
$env:STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
$env:ARYA_PLATFORM_OWNER="G..."
$env:ARYA_TREASURY="G..."
$env:ARYA_TOKEN_SAC_ID="C..."
$env:ARYA_USDC_SAC_ID="C..."
```

Optional:

```powershell
$env:ARYA_XLM_SAC_ID="C..."
```

If `ARYA_XLM_SAC_ID` is omitted, the init script derives the native XLM SAC automatically.

## 6. Deploy Contracts

```powershell
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File scripts/deploy-testnet.ps1
```

Capture the printed contract IDs and export them:

```powershell
$env:ARYA_REGISTRY_ID="C..."
$env:ARYA_STAKING_ID="C..."
$env:ARYA_CROWDFUNDING_ID="C..."
$env:ARYA_LAUNCHPAD_ID="C..."
```

## 7. Initialize Contracts

```powershell
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File scripts/init-testnet.ps1
```

This initializes:

- registry
- staking
- crowdfunding
- launchpad

## 8. Verify On-Chain State

Run read methods:

```bash
stellar contract invoke --id YOUR_REGISTRY_ID -- get_config
stellar contract invoke --id YOUR_STAKING_ID -- get_settings
stellar contract invoke --id YOUR_CROWDFUNDING_ID -- get_platform_settings
stellar contract invoke --id YOUR_LAUNCHPAD_ID -- get_platform_settings
```

## 9. Update Frontend

Set the frontend `.env` or Vercel env values using the deployed IDs:

- `VITE_REGISTRY_CONTRACT_ID`
- `VITE_CROWDFUNDING_CONTRACT_ID`
- `VITE_STAKING_CONTRACT_ID`
- `VITE_LAUNCHPAD_CONTRACT_ID`
- `VITE_ARYA_TOKEN_ID`
- `VITE_XLM_SAC_ID`
- `VITE_USDC_SAC_ID`
- `VITE_PLATFORM_OWNER`

Then rebuild/redeploy the frontend.

## 10. Record Submission Data

After deployment, save:

- live demo URL
- contract IDs
- Wasm hashes
- deploy transaction hashes
- initialize transaction hashes
- inter-contract call transaction hashes
- token/pool IDs
- screenshots

Those values belong in the root README and submission materials.
