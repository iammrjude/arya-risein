# Testnet Setup

## Identity

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

Provide the USDC SAC ID you are using for your test environment and store it in:

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
