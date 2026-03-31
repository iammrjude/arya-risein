# Deployment Guide

This guide covers the full Arya testnet deployment flow.

## 1. Prerequisites

- Rust stable installed
- `wasm32v1-none` target installed
- Stellar CLI GitHub Action `stellar/stellar-cli@v23.3.0`
- a funded Stellar testnet identity in the CLI
- ARYA token/SAC available
- USDC SAC available for your test setup

Git Bash is recommended for local command-line work. PowerShell remains available as a Windows fallback for the helper scripts.

Install the target:

```bash
rustup target add wasm32v1-none
```

Check CLI version:

```bash
stellar --version
```

## 2. Create or Import a CLI Identity

Stellar CLI identities are global by default. If you already created identities in the old AryaFund work, the recommended path is to create new Arya names from them and then use the Arya names everywhere.

Useful commands:

```bash
stellar keys ls
stellar keys public-key NAME
stellar keys secret NAME
stellar keys use NAME
stellar keys unset
stellar keys generate NAME
stellar keys fund NAME --network testnet
stellar keys add NAME --secret-key
stellar keys rm NAME
```

Inspect existing identities:

```bash
stellar keys ls
stellar keys public-key arya-fund-deployer
stellar keys public-key arya-fund-treasury
```

Create Arya-specific names by copying the old ones:

```bash
stellar keys secret arya-fund-deployer
stellar keys add arya-deployer --secret-key
stellar keys use arya-deployer

stellar keys secret arya-fund-treasury
stellar keys add arya-treasury --secret-key
```

The add command prompts you to paste the secret key.

Verify:

```bash
stellar keys public-key arya-deployer
stellar keys public-key arya-treasury
```

If the new names are correct, use them for deployment commands and docs going forward.

After you confirm everything works, optionally remove the old names:

```bash
stellar keys rm arya-fund-deployer
stellar keys rm arya-fund-treasury
```

If you want the keys stored only for this repo, use a repo-local config dir:

```bash
mkdir -p .stellar
stellar --config-dir ./.stellar keys add arya-deployer --secret-key
stellar --config-dir ./.stellar keys add arya-treasury --secret-key
stellar --config-dir ./.stellar keys use arya-deployer
```

Then keep using:

```bash
stellar --config-dir ./.stellar ...
```

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
bash scripts/build-all.sh
```

Windows fallback:

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

Where these values come from:

- `STELLAR_ACCOUNT`
  The local Stellar CLI identity name for manual local runs. In GitHub Actions, this is instead the secret signing key stored in repository Secrets.
- `ARYA_PLATFORM_OWNER`
  Public wallet address `G...`
- `ARYA_TREASURY`
  Public wallet address `G...`
- `ARYA_TOKEN_SAC_ID`
  The ARYA token SAC contract ID after you create/deploy the ARYA asset contract
- `ARYA_USDC_SAC_ID`
  Derive from testnet USDC:

  ```bash
  stellar contract id asset \
    --network testnet \
    --asset USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
  ```

If you are using repo-local keys, the `STELLAR_ACCOUNT` value is still just the identity name like `arya-deployer`; the difference is that your manual `stellar` commands should include `--config-dir ./.stellar`.

Optional:

```powershell
$env:ARYA_XLM_SAC_ID="C..."
```

Derive native XLM SAC:

```bash
stellar contract id asset --asset native --network testnet
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

## GitHub Actions Setup

Before CI/CD can work on GitHub:

1. open the repository on GitHub
2. go to `Settings -> Actions -> General`
3. ensure GitHub Actions is enabled
4. go to `Settings -> Secrets and variables -> Actions`
5. add:
   - secret: `STELLAR_ACCOUNT`
   - variables: `STELLAR_RPC_URL`, `STELLAR_NETWORK_PASSPHRASE`, `ARYA_PLATFORM_OWNER`, `ARYA_TREASURY`, `ARYA_TOKEN_SAC_ID`, `ARYA_USDC_SAC_ID`
6. after first deploy, add:
   - `ARYA_REGISTRY_ID`
   - `ARYA_STAKING_ID`
   - `ARYA_CROWDFUNDING_ID`
   - `ARYA_LAUNCHPAD_ID`

First deploy vs later upgrade:

- first run:
  - leave `ARYA_REGISTRY_ID`, `ARYA_STAKING_ID`, `ARYA_CROWDFUNDING_ID`, and `ARYA_LAUNCHPAD_ID` unset
  - workflow deploys fresh contracts
- after success:
  - copy the printed contract IDs into those GitHub Variables
- later runs:
  - workflow sees the IDs and upgrades the existing contracts
