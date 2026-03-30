# Arya Contracts

This workspace contains the Arya Soroban smart contracts for Stellar Testnet.

## Contracts In Scope

- `arya_registry`
  Stores the live contract addresses and shared protocol configuration.
- `arya_staking`
  ARYA staking with separate XLM and USDC reward pools.
- `arya_crowdfunding`
  Single-asset campaigns with automatic fee split to treasury and staking.
- `arya_launchpad`
  Single-asset token sales with automatic fee split to treasury and staking.
- `arya_fund`
  Legacy baseline contract kept only for migration/reference context.

## Upgradeability

Every new Arya contract exposes:

```rust
upgrade(new_wasm_hash: BytesN<32>)
```

That means the new suite is designed for testnet upgrades instead of forced redeploys for every bug fix.

## Screenshots

Add screenshots after running the flows below.

### Contract Tests Passing

![Contract workspace tests passing](../screenshots/contract-tests.png)
*Show the full `cargo test --workspace` output after the new Arya contracts are added.*

### Wasm Builds Passing

![Wasm contract builds passing](../screenshots/contract-builds.png)
*Show the `stellar contract build` output for registry, staking, crowdfunding, and launchpad.*

### Explorer Verification

![Explorer view for deployed contracts](../screenshots/contract-explorer.png)
*Add a screenshot from Stellar Expert or the Stellar Lab contract explorer after deployment.*

## Toolchain Requirements

- Rust stable
- `wasm32v1-none` target
- Soroban SDK `25.3.0`
- Stellar CLI GitHub Action `stellar/stellar-cli@v23.3.0`
- PowerShell for the helper scripts
- Bash for the GitHub Actions deploy/build scripts

Git Bash is a good default shell for local work too, especially for the bash scripts in `contract/scripts/`.

Install the Wasm target:

```bash
rustup target add wasm32v1-none
```

Check the CLI version:

```bash
stellar --version
```

## Generate or Import a Testnet Identity

### Option 1: Generate a new local identity

```bash
stellar keys generate arya-admin -q
```

Set it as the active identity:

```bash
stellar keys use arya-admin
```

Get the public key:

```bash
stellar keys public-key arya-admin
```

### Option 2: Import an existing secret

```bash
stellar keys add arya-admin --secret-key SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Then select it:

```bash
stellar keys use arya-admin
```

## Fund the Testnet Account

```bash
stellar keys fund arya-admin --network testnet
```

If needed, verify the account balance in the Stellar Lab or Stellar Expert testnet explorer.

## Configure Testnet Network

```bash
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

stellar network use testnet
```

## Build, Lint, and Test

Run the full Rust quality gate:

```bash
cd contract
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo test --workspace
bash scripts/build-all.sh
```

Build deployable Wasm files locally:

```powershell
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File scripts/build-all.ps1
```

Equivalent Git Bash command:

```bash
bash scripts/build-all.sh
```

This builds:

- `arya_registry.wasm`
- `arya_staking.wasm`
- `arya_crowdfunding.wasm`
- `arya_launchpad.wasm`

## Deploy Flow

Deployment is split into three steps:

1. deploy Wasm contracts
2. initialize the deployed contracts
3. update frontend environment values

### Required Environment Variables

Before deployment, set:

```powershell
$env:STELLAR_ACCOUNT="arya-admin"
$env:STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
$env:STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
$env:ARYA_PLATFORM_OWNER="G..."
$env:ARYA_TREASURY="G..."
$env:ARYA_TOKEN_SAC_ID="C..."
$env:ARYA_USDC_SAC_ID="C..."
```

Notes:

- `STELLAR_ACCOUNT` is the local Stellar CLI identity name, not the raw public key.
- `ARYA_TOKEN_SAC_ID` is the ARYA Stellar Asset Contract ID.
- `ARYA_USDC_SAC_ID` is the USDC Stellar Asset Contract ID for your test setup.
- If you already know the native XLM SAC, you can also set `ARYA_XLM_SAC_ID`. Otherwise the scripts derive it automatically.

### Step 1: Deploy the Contracts Locally

```powershell
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File scripts/deploy-testnet.ps1
```

This script:

- runs `cargo test --workspace`
- builds each deployable contract
- deploys:
  - `arya_registry`
  - `arya_staking`
  - `arya_crowdfunding`
  - `arya_launchpad`
- prints the deployed contract IDs

Capture those contract IDs and set:

```powershell
$env:ARYA_REGISTRY_ID="C..."
$env:ARYA_STAKING_ID="C..."
$env:ARYA_CROWDFUNDING_ID="C..."
$env:ARYA_LAUNCHPAD_ID="C..."
```

### Step 2: Initialize the Contracts

```powershell
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File scripts/init-testnet.ps1
```

This script initializes:

- registry
- staking
- crowdfunding
- launchpad

Default initialization values in the script:

- staking min lockup: `7 days`
- crowdfunding fee: `250` basis points
- crowdfunding staking share: `5000` basis points
- crowdfunding action window: `7 days`
- launchpad fee: `300` basis points
- launchpad staking share: `5000` basis points

### Step 3: Verify the Deployment

Recommended checks:

```bash
stellar contract invoke --id YOUR_REGISTRY_ID -- get_config
stellar contract invoke --id YOUR_STAKING_ID -- get_settings
stellar contract invoke --id YOUR_CROWDFUNDING_ID -- get_platform_settings
stellar contract invoke --id YOUR_LAUNCHPAD_ID -- get_platform_settings
```

Then record:

- contract IDs
- Wasm hashes
- deploy transaction hashes
- initialize transaction hashes
- explorer links

Put those values in the root README after deployment.

## CI/CD Secrets

The GitHub Actions workflow files live in:

- [../.github/workflows/ci.yml](../.github/workflows/ci.yml)
- [../.github/workflows/testnet-deploy.yml](../.github/workflows/testnet-deploy.yml)

### `ci.yml`

This workflow runs:

- `cargo fmt --all -- --check`
- `cargo clippy --workspace --all-targets --all-features -- -D warnings`
- `cargo test --workspace`
- Wasm builds
- frontend lint/build

It does not need custom GitHub secrets.

### `testnet-deploy.yml`

This workflow needs repository secrets in GitHub Actions.

Go to:

`Settings -> Secrets and variables -> Actions`

Also make sure Actions is enabled in:

`Settings -> Actions -> General`

Create this GitHub Actions secret:

- `STELLAR_ACCOUNT`
  Use a signing secret that the Stellar CLI can sign with on the GitHub runner. For Actions, set this to a secret key starting with `SC...` rather than a local alias like `arya-admin`.

Create these GitHub Actions variables:

- `STELLAR_RPC_URL`
  `https://soroban-testnet.stellar.org`
- `STELLAR_NETWORK_PASSPHRASE`
  `Test SDF Network ; September 2015`
- `ARYA_PLATFORM_OWNER`
  Owner public address `G...`
- `ARYA_TREASURY`
  Treasury public address `G...`
- `ARYA_USDC_SAC_ID`
  Testnet USDC SAC contract ID `C...`
- `ARYA_TOKEN_SAC_ID`
  ARYA token Stellar Asset Contract ID `C...`
- `ARYA_XLM_SAC_ID`
  Optional native XLM SAC override `C...`

Leave these empty on the very first deploy. After the first deploy succeeds, set them so future runs auto-upgrade:

- `ARYA_REGISTRY_ID`
- `ARYA_STAKING_ID`
- `ARYA_CROWDFUNDING_ID`
- `ARYA_LAUNCHPAD_ID`

Notes:

- do not store secret keys in plain repo variables
- only store them in GitHub Actions secrets
- use GitHub Actions variables for non-sensitive config values
- the workflow now uses bash on GitHub Actions for build/deploy reliability
- if `ARYA_REGISTRY_ID` is empty, the workflow performs a first-time deploy and prints the new contract IDs
- once you copy those IDs into the repository variables, later runs automatically take the upgrade path

In plain English:

- `CI` means every push is validated automatically
- `CD` means the deploy workflow can publish or upgrade contracts after validation passes

## Upgrade Flow

When you make a contract change:

1. rebuild Wasm
2. upload the new Wasm
3. call `upgrade(new_wasm_hash)` on the deployed contract
4. verify read functions still work
5. update frontend config if addresses change

Automated local upgrade:

```powershell
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File scripts/upgrade-testnet.ps1
```

Required environment variables for the local PowerShell upgrade script:

- `ARYA_REGISTRY_ID`
- `ARYA_STAKING_ID`
- `ARYA_CROWDFUNDING_ID`
- `ARYA_LAUNCHPAD_ID`

## Contract Build Commands

If you prefer manual build commands:

```bash
stellar contract build --package arya_registry
stellar contract build --package arya_staking
stellar contract build --package arya_crowdfunding
stellar contract build --package arya_launchpad
```

## Manual Upgrade Commands

Example:

```bash
stellar contract upload \
  --source-account arya-admin \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --wasm target/wasm32v1-none/release/arya_staking.wasm
```

Then:

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

## Explorer / Submission Template

Fill these in after deployment:

| Property | Value |
| ---------- | ------- |
| Registry Contract | `ADD_REGISTRY_ID_HERE` |
| Staking Contract | `ADD_STAKING_ID_HERE` |
| Crowdfunding Contract | `ADD_CROWDFUNDING_ID_HERE` |
| Launchpad Contract | `ADD_LAUNCHPAD_ID_HERE` |
| ARYA Token / SAC | `ADD_ARYA_TOKEN_ID_HERE` |
| XLM SAC | `ADD_XLM_SAC_ID_HERE` |
| USDC SAC | `ADD_USDC_SAC_ID_HERE` |

## Related Docs

- [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)
- [../docs/UPGRADES.md](../docs/UPGRADES.md)
- [../docs/MIGRATIONS.md](../docs/MIGRATIONS.md)
- [../docs/TESTNET_SETUP.md](../docs/TESTNET_SETUP.md)
- [../docs/FEE_FLOW.md](../docs/FEE_FLOW.md)
- [../docs/STAKING_DESIGN.md](../docs/STAKING_DESIGN.md)
- [../docs/LAUNCHPAD_DESIGN.md](../docs/LAUNCHPAD_DESIGN.md)
