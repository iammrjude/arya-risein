# Testnet Setup

## Identity

Stellar CLI identities are global by default, so the recommended path is to create new Arya names from the old legacy identities and use the new names going forward.

Useful key commands:

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

Inspect them:

```bash
stellar keys ls
stellar keys public-key legacy-deployer
stellar keys public-key legacy-treasury
```

To create Arya names:

```bash
stellar keys secret legacy-deployer
stellar keys add arya-deployer --secret-key
stellar keys use arya-deployer

stellar keys secret legacy-treasury
stellar keys add arya-treasury --secret-key
```

Verify:

```bash
stellar keys public-key arya-deployer
stellar keys public-key arya-treasury
```

After confirming the new identities work, you can optionally remove the old ones:

```bash
stellar keys rm legacy-deployer
stellar keys rm legacy-treasury
```

If you want the identities stored only inside this repo:

```bash
mkdir -p .stellar
stellar --config-dir ./.stellar keys add arya-deployer --secret-key
stellar --config-dir ./.stellar keys add arya-treasury --secret-key
stellar --config-dir ./.stellar keys use arya-deployer
stellar --config-dir ./.stellar keys ls
```

`.stellar/` is gitignored.

Generate:

```bash
stellar keys generate arya-admin -q
```

Use it:

```bash
stellar keys use arya-admin
```

Show the public key:

```bash
stellar keys public-key arya-admin
```

## Fund the Identity

```bash
stellar keys fund arya-admin --network testnet
```

## Native XLM SAC

```bash
stellar contract id asset --asset native --network testnet
```

## USDC on Testnet

Derive the testnet USDC SAC ID with:

```bash
stellar contract id asset \
  --network testnet \
  --asset USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

Then store it in:

```powershell
$env:ARYA_USDC_SAC_ID="C..."
```

## Suggested Deployment Variables

```powershell
$env:STELLAR_ACCOUNT="arya-admin"
$env:STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
$env:STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
$env:ARYA_PLATFORM_OWNER="G..."
$env:ARYA_TREASURY="G..."
$env:ARYA_TOKEN_ASSET="ARYA:G..."
$env:ARYA_USDC_SAC_ID="C..."
```

For GitHub Actions:

- `STELLAR_ACCOUNT` should be the secret signing key in repository Secrets
- `ARYA_PLATFORM_OWNER` and `ARYA_TREASURY` should be public `G...` addresses in repository Variables
- `ARYA_TOKEN_ASSET` should be the ARYA classic asset string, usually `ARYA:<ARYA_PLATFORM_OWNER>`
- `ARYA_USDC_SAC_ID` should be derived from the testnet USDC asset
- leave `ARYA_REGISTRY_ID`, `ARYA_STAKING_ID`, `ARYA_CROWDFUNDING_ID`, and `ARYA_LAUNCHPAD_ID` empty on the first deploy

After the first successful run of `testnet-deploy.yml`, go to `GitHub -> Settings -> Secrets and variables -> Actions -> Variables` and add the values printed by the workflow:

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

## Current ARYA Operating Plan

- Total supply target: `100,000,000 ARYA`
- Treasury starting reserve: `45,000,000 ARYA`
- Initial `ARYA/XLM` pool seed from treasury: `500,000 ARYA + 5,000 XLM`

Frontend operations now assume:

- `/admin` is used by the issuer/platform owner to fund the treasury with ARYA
- `/treasury` is restricted to the treasury wallet for liquidity management
- `/token` is the public-facing ARYA page for tokenomics and trustline guidance
