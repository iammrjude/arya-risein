# Arya Architecture

Arya is a modular Stellar platform with four live surfaces:

- Crowdfunding
- Launchpad
- Staking
- Admin

And one shared system layer:

- Registry

## Contracts

- `arya_registry`
  Stores canonical contract addresses, treasury, and shared references.
- `arya_staking`
  Stakes ARYA and distributes XLM / USDC rewards through separate pools.
- `arya_crowdfunding`
  Single-asset campaigns, fee split to treasury + staking, organizer controls.
- `arya_launchpad`
  Single-asset token sales, fee split to treasury + staking, refunds on failed sales.

ARYA itself is expected to be issued as a Stellar asset and referenced by the contracts via its Stellar Asset Contract.

## Frontend

The frontend uses a modular route layout:

- `/`
- `/crowdfunding/*`
- `/launchpad/*`
- `/staking/*`
- `/admin`

It keeps the original dark/purple Arya visual identity while expanding discoverability and mobile navigation.

## Event Sync

The frontend includes an event polling abstraction using Stellar RPC `getEvents` and is designed to refresh module state in near-real-time when the upgradeable contracts emit events. This is RPC polling, not a dedicated WebSocket stream.
