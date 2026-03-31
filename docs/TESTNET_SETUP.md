# Testnet Setup

## Identity

Stellar CLI identities are global by default, so the recommended path is to create new Arya names from the old AryaFund identities and use the new names going forward.

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
stellar keys public-key arya-fund-deployer
stellar keys public-key arya-fund-treasury
```

To create Arya names:

```bash
stellar keys secret arya-fund-deployer
stellar keys add arya-deployer --secret-key
stellar keys use arya-deployer

stellar keys secret arya-fund-treasury
stellar keys add arya-treasury --secret-key
```

Verify:

```bash
stellar keys public-key arya-deployer
stellar keys public-key arya-treasury
```

After confirming the new identities work, you can optionally remove the old ones:

```bash
stellar keys rm arya-fund-deployer
stellar keys rm arya-fund-treasury
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
$env:ARYA_TOKEN_SAC_ID="C..."
$env:ARYA_USDC_SAC_ID="C..."
```

For GitHub Actions:

- `STELLAR_ACCOUNT` should be the secret signing key in repository Secrets
- `ARYA_PLATFORM_OWNER` and `ARYA_TREASURY` should be public `G...` addresses in repository Variables
- leave `ARYA_REGISTRY_ID`, `ARYA_STAKING_ID`, `ARYA_CROWDFUNDING_ID`, and `ARYA_LAUNCHPAD_ID` empty on the first deploy
