# Arya Contracts

This workspace contains the Arya Soroban smart contracts.

## Packages

- `arya_registry`
- `arya_staking`
- `arya_crowdfunding`
- `arya_launchpad`
- `arya_fund` (legacy baseline contract kept for reference / migration context)

## Upgradeability

The new Arya contracts expose an `upgrade(new_wasm_hash)` entrypoint and are designed for safe testnet iteration.

## Test

```bash
cargo test --workspace
```

## Build

Use:

```bash
stellar contract build --package arya_registry
stellar contract build --package arya_staking
stellar contract build --package arya_crowdfunding
stellar contract build --package arya_launchpad
```

Or:

```powershell
pwsh -File scripts/build-all.ps1
```

## Deploy

Use:

```powershell
pwsh -File scripts/deploy-testnet.ps1
```

## Upgrade

Use:

```powershell
pwsh -File scripts/upgrade-testnet.ps1
```

## Docs

- `../docs/DEPLOYMENT.md`
- `../docs/UPGRADES.md`
- `../docs/MIGRATIONS.md`
- `../docs/FEE_FLOW.md`
- `../docs/STAKING_DESIGN.md`
- `../docs/LAUNCHPAD_DESIGN.md`
