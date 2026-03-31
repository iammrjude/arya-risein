# Arya Architecture

Arya is a modular Stellar platform with four live surfaces:

- Token
- Crowdfunding
- Launchpad
- Staking
- Treasury
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
- `/token`
- `/crowdfunding/*`
- `/launchpad/*`
- `/staking/*`
- `/treasury`
- `/admin`

It keeps the original dark/purple Arya visual identity while expanding discoverability and mobile navigation.

## Token & Treasury Model

- ARYA total supply is planned at `100,000,000`.
- Treasury starts with `45,000,000 ARYA`.
- Initial treasury-seeded liquidity target is `500,000 ARYA` paired with `5,000 XLM`.
- `/token` is a public information surface for ARYA tokenomics, utility, and trustline instructions.
- `/treasury` is restricted to the treasury wallet and is intended for liquidity operations such as adding or removing `ARYA/XLM` liquidity.

## Event Sync

The frontend includes an event polling abstraction using Stellar RPC `getEvents` and is designed to refresh module state in near-real-time when the upgradeable contracts emit events. This is RPC polling, not a dedicated WebSocket stream.
