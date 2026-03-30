# Upgrade Guide

All new Arya contracts expose:

- `upgrade(new_wasm_hash: BytesN<32>)`

This is the supported upgrade path for testnet.

## Upgrade flow

1. Build the updated contract package.
2. Upload new Wasm:

```bash
stellar contract upload \
  --source-account YOUR_IDENTITY \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --wasm target/wasm32v1-none/release/<contract>.wasm
```

3. Invoke the contract's `upgrade` function:

```bash
stellar contract invoke \
  --source-account YOUR_IDENTITY \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --id CONTRACT_ID \
  -- \
  upgrade \
  --new-wasm-hash WASM_HASH
```

4. Verify the contract still responds to read functions.
5. Update frontend config if any addresses changed.

## Automated upgrade

Use:

```powershell
pwsh -File contract/scripts/upgrade-testnet.ps1
```

Provide environment variables for existing deployed contract IDs.
