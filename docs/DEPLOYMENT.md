# Deployment Guide

This project targets Stellar Testnet.

## Prerequisites

- Rust toolchain
- `wasm32v1-none` target
- `stellar` CLI
- Configured Stellar testnet identity

## Configure network and identity

```bash
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

stellar keys use your-identity
stellar network use testnet
```

## Build and test

```bash
cd contract
cargo test --workspace
```

## Deploy contracts

Use:

```powershell
pwsh -File contract/scripts/deploy-testnet.ps1
```

The script:

- runs the workspace tests
- builds each package
- deploys `arya_registry`, `arya_staking`, `arya_crowdfunding`, and `arya_launchpad`
- prints deployed contract IDs

After deployment:

1. initialize each contract
2. register addresses in `arya_registry`
3. update frontend `.env`
4. redeploy frontend

See `MIGRATIONS.md` and `FRONTEND_CONFIGURATION.md`.
