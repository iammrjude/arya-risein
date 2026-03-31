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

Stellar CLI identities are global by default. If you already created identities in earlier legacy work, the recommended path is to create new Arya names from them and then use the Arya names everywhere.

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
stellar keys public-key legacy-deployer
stellar keys public-key legacy-treasury
```

Create Arya-specific names by copying the old ones:

```bash
stellar keys secret legacy-deployer
stellar keys add arya-deployer --secret-key
stellar keys use arya-deployer

stellar keys secret legacy-treasury
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
stellar keys rm legacy-deployer
stellar keys rm legacy-treasury
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
$env:ARYA_TOKEN_ASSET="ARYA:G..."
$env:ARYA_USDC_SAC_ID="C..."
```

Where these values come from:

- `STELLAR_ACCOUNT`
  The local Stellar CLI identity name for manual local runs. In GitHub Actions, this is instead the secret signing key stored in repository Secrets.
- `ARYA_PLATFORM_OWNER`
  Public wallet address `G...`
- `ARYA_TREASURY`
  Public wallet address `G...`
- `ARYA_TOKEN_ASSET`
  The ARYA classic asset string, for example `ARYA:G...`
- `ARYA_TOKEN_ISSUER`
  Optional shortcut if you want the script to derive `ARYA_TOKEN_ASSET` as `ARYA:<issuer>`
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

If `ARYA_TOKEN_SAC_ID` is omitted, `deploy-or-upgrade-testnet.sh` now deploys the ARYA asset contract for `ARYA_TOKEN_ASSET` and prints the resulting `ARYA_TOKEN_SAC_ID` so you can persist it afterwards.

## 6. Deploy Or Upgrade With The Unified Script

The GitHub Actions workflow uses the unified script:

```bash
bash scripts/deploy-or-upgrade-testnet.sh
```

That script does all of the following:

- runs `cargo test --workspace`
- builds the deployable Wasm contracts
- performs a first deploy if `ARYA_REGISTRY_ID` is not set
- performs contract upgrades if `ARYA_REGISTRY_ID` and the other deployed contract IDs are already set
- deploys the ARYA token SAC automatically on first deploy if `ARYA_TOKEN_SAC_ID` is still unset

After a first deploy it prints the values you should persist for future runs:

```powershell
$env:ARYA_REGISTRY_ID="C..."
$env:ARYA_STAKING_ID="C..."
$env:ARYA_CROWDFUNDING_ID="C..."
$env:ARYA_LAUNCHPAD_ID="C..."
$env:ARYA_TOKEN_ASSET="ARYA:G..."
$env:ARYA_TOKEN_SAC_ID="C..."
$env:ARYA_USDC_ASSET="USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
$env:ARYA_USDC_SAC_ID="C..."
$env:ARYA_XLM_ASSET="native"
$env:ARYA_XLM_SAC_ID="C..."
```

## 7. What The Unified Script Initializes

On first deploy, `deploy-or-upgrade-testnet.sh` initializes:

- registry
- staking
- crowdfunding
- launchpad

It also wires the contracts together with:

- owner and treasury
- ARYA staking token
- native XLM reward token
- USDC reward token
- staking contract reference in crowdfunding
- staking contract reference in launchpad

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

## Submission Address Reference

Use these current testnet identifiers in the README and delivery notes:

- ARYA token asset: `ARYA:GBLH7QUEY43J3AJSIYPRUQKKUFX577GSYWRRQJVNFOV7MUON3YMM5IJQ`
- ARYA issuer: `GBLH7QUEY43J3AJSIYPRUQKKUFX577GSYWRRQJVNFOV7MUON3YMM5IJQ`
- ARYA token SAC: `CBC42DVQ5J5KIXLJ2GIOX3PRZOZ5H63GPQKXXIYMPNOR2XXWNBEO332W`
- ARYA/XLM liquidity pool ID: `37c5defa969c8015fed5003f304aeb91c69da39440e15640663db8ea906fadc5`
- live demo URL: <https://arya-on-stellar.vercel.app>
- machine-readable reference file: `docs/testnet-reference.json`

Notes:

- the ARYA token is not a custom Rust token contract in this repo; it is a Stellar-issued asset mirrored by a Stellar Asset Contract
- the ARYA/XLM pool is not a custom Rust AMM contract; it is a standard Stellar liquidity pool identified by the pool ID above
- for the inter-contract call submission requirement, capture a real testnet transaction hash from:
  - crowdfunding `withdraw` calling staking `deposit_xlm_rewards` or `deposit_usdc_rewards`
  - launchpad `withdraw_funds` calling staking `deposit_xlm_rewards` or `deposit_usdc_rewards`

Known testnet product transactions:

- create crowdfunding campaign: `95498616376b8b4f084f44eb3acd1b187023dbb80a5960379e1cbb5f4f1f2c4b`
- issue `2,000 ARYA` to treasury: `0b32b31f396b721efd7e485b0a5b621986dd7bc6d8c75fd514cd323687bc7320`
- add liquidity `500,000 ARYA + 5,000 XLM`: `e7ef4150aebc016f878daa0adc898a0f2274bd5ff708b5499397cf945367745c`
- buy ARYA with `25 XLM`: `758ef9c0d8da64d3fb7da9bb1baacdab2671d2d3737531d7b9998c3b61bf8163`
- sell `100 ARYA` for XLM: `0ea99fe10d5ed73ab0ea9377a83ad4df44b43d6002ea768ec963c7b88a3d0bbf`
- donate `5,200 XLM`: `6a1d75772c7f34b904b93a6addf77cebd47710c7858d9d8ecc1fbd670443bf55`
- crowdfunding withdraw with inter-contract fee routing: `fbe49b8bb39d83887ba9a330999c9872233b110c5eb846b461e080d9582fe05f`

Current submission status:

- crowdfunding inter-contract call evidence: captured
- launchpad inter-contract call evidence: still pending a live `withdraw_funds` transaction hash

## Treasury Liquidity Plan

Current operating assumptions for the frontend and treasury UX:

- ARYA total supply: `100,000,000`
- Treasury starting reserve: `45,000,000 ARYA`
- Initial `ARYA/XLM` liquidity seed from treasury: `500,000 ARYA + 5,000 XLM`
- Opening target AMM price: `1 ARYA = 0.01 XLM`

The operational flow is:

1. issuer wallet sends ARYA into the treasury wallet from the admin page
2. treasury wallet adds the initial `ARYA/XLM` liquidity position
3. treasury wallet manages future liquidity actions from the treasury page

The CI/CD workflow was also hardened:

- deploys only trigger on contract build-relevant changes
- push-triggered runs print the changed files
- upgrades are skipped when the built Wasm matches the deployed Wasm

## Current Testnet Deployment

Current deployed addresses:

- Platform owner: `GBLH7QUEY43J3AJSIYPRUQKKUFX577GSYWRRQJVNFOV7MUON3YMM5IJQ`
- Treasury: `GAZZRHDL3SUTFD2CWWDVVHQXGVXWWQYTJNGMC6IQIQD7OAKQLDBJND7B`
- Registry: `CDTYETLJFF3YXL73VU6HDSM55S3W4WIJISN4GSSNBRE3NRKGVTAIJQSX`
- Staking: `CAIGE27WE6FVOAFYHNTG6UQSDQH4RILGPE2DLISDG6TXY5D2QQFDCUUH`
- Crowdfunding: `CCXT5UABFQIJAMEFU6JSZUUDE42HTWZZDYKZCXBON47LXKKK3STJIC3I`
- Launchpad: `CDSWDFZRA5MIWLFJCIHBTIQ2XTIWUZSH34U6GXBNNCALVRPIBKFL7GGU`
- ARYA token asset: `ARYA:GBLH7QUEY43J3AJSIYPRUQKKUFX577GSYWRRQJVNFOV7MUON3YMM5IJQ`
- ARYA token SAC: `CBC42DVQ5J5KIXLJ2GIOX3PRZOZ5H63GPQKXXIYMPNOR2XXWNBEO332W`
- ARYA/XLM liquidity pool ID: `37c5defa969c8015fed5003f304aeb91c69da39440e15640663db8ea906fadc5`
- XLM SAC: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- USDC asset: `USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
- USDC SAC: `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`

Known deployment transaction hashes:

- ARYA token SAC deploy: `152344f663bdd5aed18e3d6cc31d7d9638d76b07c469ec19e9f6c9dafcf1a8dd`
- Staking deploy: `045faea76fad1b4a584fc9792b161bcb3a6d960ede58fe3b235166f517ec2398`
- Crowdfunding deploy: `91044d8321beef3efc4ebe6806511bd919a38f2e21d61dc00d1ea0360513236a`
- Launchpad deploy: `5a6fd1677e3751ae5c8f018a31c20cc448ecf182ebb05d6cef0801b64e14b728`
- Registry initialize: `5fcfa75fd1001aafc20cdcd716c671d51dca9295cf2d115d7211736497a335b7`

Known explorer links:

- ARYA token SAC: <https://lab.stellar.org/r/testnet/contract/CBC42DVQ5J5KIXLJ2GIOX3PRZOZ5H63GPQKXXIYMPNOR2XXWNBEO332W>
- Registry: <https://lab.stellar.org/r/testnet/contract/CDTYETLJFF3YXL73VU6HDSM55S3W4WIJISN4GSSNBRE3NRKGVTAIJQSX>
- Staking: <https://lab.stellar.org/r/testnet/contract/CAIGE27WE6FVOAFYHNTG6UQSDQH4RILGPE2DLISDG6TXY5D2QQFDCUUH>
- Crowdfunding: <https://lab.stellar.org/r/testnet/contract/CCXT5UABFQIJAMEFU6JSZUUDE42HTWZZDYKZCXBON47LXKKK3STJIC3I>
- Launchpad: <https://lab.stellar.org/r/testnet/contract/CDSWDFZRA5MIWLFJCIHBTIQ2XTIWUZSH34U6GXBNNCALVRPIBKFL7GGU>

The first deploy also initialized staking, crowdfunding, and launchpad successfully, but their exact initialize transaction hashes were not copied into the captured log snippet. Add them here later if you export the full workflow log.

## GitHub Actions Setup

Before CI/CD can work on GitHub:

1. open the repository on GitHub
2. go to `Settings -> Actions -> General`
3. ensure GitHub Actions is enabled
4. go to `Settings -> Secrets and variables -> Actions`
5. add:
   - secret: `STELLAR_ACCOUNT`
   - variables: `STELLAR_RPC_URL`, `STELLAR_NETWORK_PASSPHRASE`, `ARYA_PLATFORM_OWNER`, `ARYA_TREASURY`, `ARYA_TOKEN_ASSET`, `ARYA_USDC_SAC_ID`
6. after first deploy, add:
   - `ARYA_REGISTRY_ID`
   - `ARYA_STAKING_ID`
   - `ARYA_CROWDFUNDING_ID`
   - `ARYA_LAUNCHPAD_ID`
   - `ARYA_TOKEN_ASSET`
   - `ARYA_TOKEN_SAC_ID`
   - `ARYA_USDC_ASSET`
   - `ARYA_USDC_SAC_ID`
   - `ARYA_XLM_ASSET`
   - `ARYA_XLM_SAC_ID`

Where to get each GitHub Actions value:

- `STELLAR_ACCOUNT`
  Use the deployer secret key `S...`. Get it locally with `stellar keys secret YOUR_IDENTITY`, then save it under `Settings -> Secrets and variables -> Actions -> Secrets`.
- `ARYA_PLATFORM_OWNER`
  Use the owner public key `G...`. Get it locally with `stellar keys public-key YOUR_IDENTITY`.
- `ARYA_TREASURY`
  Use the treasury public key `G...`. Get it locally with `stellar keys public-key YOUR_TREASURY_IDENTITY`.
- `ARYA_TOKEN_ASSET`
  Use the ARYA classic asset string, usually `ARYA:<ARYA_PLATFORM_OWNER>`.
- `ARYA_USDC_SAC_ID`
  Derive it with:

  ```bash
  stellar contract id asset \
    --network testnet \
    --asset USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
  ```

- `ARYA_XLM_SAC_ID`
  Optional. Derive it with:

  ```bash
  stellar contract id asset --asset native --network testnet
  ```

First deploy vs later upgrade:

- first run:
  - leave `ARYA_REGISTRY_ID`, `ARYA_STAKING_ID`, `ARYA_CROWDFUNDING_ID`, and `ARYA_LAUNCHPAD_ID` unset
  - workflow deploys fresh contracts
  - if `ARYA_TOKEN_SAC_ID` is unset, it also deploys the ARYA token SAC for `ARYA_TOKEN_ASSET`
- after success:
  - copy the printed values into `Settings -> Secrets and variables -> Actions -> Variables`
- later runs:
  - workflow sees the IDs and upgrades the existing contracts
