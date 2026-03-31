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

## What Arya Is Trying To Do

Arya is not just a crowdfunding contract with a nicer UI. It is structured as a small product ecosystem where multiple on-chain modules share value and configuration.

At a high level:

- crowdfunding lets organizers raise funds from supporters
- launchpad lets projects run token sales
- staking lets ARYA holders earn rewards from platform activity
- treasury manages liquidity and receives its share of fees
- admin gives operators a safe place to manage shared settings
- registry keeps the canonical addresses and shared references in one place

The goal is to make these modules reinforce each other instead of operating independently. When a crowdfunding campaign or launchpad sale settles successfully, fee revenue is split and part of that value flows into staking. That is the main cross-module economic connection in v1.

## System Overview

The system has three layers:

### 1. Contract Layer

Soroban contracts enforce the core protocol rules:

- what can be created
- who can withdraw
- how fees are calculated
- how fees are split between treasury and staking
- how staking positions and rewards are tracked
- how shared addresses are stored

### 2. Treasury / Token Layer

ARYA is issued as a Stellar asset and mirrored by a Stellar Asset Contract. The treasury then uses ARYA operationally:

- it receives ARYA from the issuer side
- it seeds and manages the `ARYA/XLM` liquidity position
- it holds treasury inventory for future ecosystem operations

This layer is important because Arya is not using a custom Rust token contract for ARYA. Instead, it combines Stellar asset issuance, a Stellar Asset Contract, and treasury-driven liquidity management.

### 3. Frontend Layer

The React frontend turns the contract suite into a usable product:

- public discovery pages
- create/manage flows
- staking views
- admin controls
- treasury-only liquidity operations

It also acts as the place where shared addresses, token information, and operational instructions become understandable to normal users.

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

## How Value Moves Through The Platform

The simplest way to understand the platform is to follow the money:

1. the issuer side funds treasury with ARYA
2. treasury seeds the `ARYA/XLM` pool
3. users can hold or swap into ARYA
4. users interact with crowdfunding and launchpad
5. successful protocol withdrawals charge a protocol fee
6. that fee is split:
   - part goes to treasury
   - part goes into staking reward pools
7. ARYA stakers claim those rewards

That fee-routing behavior is where the main inter-contract behavior appears in production use.

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

## Intended Reader Experience

The frontend is intentionally split into public and operator-facing surfaces:

- `/token` explains ARYA, tokenomics, trustlines, and swaps
- `/crowdfunding/*` handles campaign discovery and campaign operations
- `/launchpad/*` handles sale discovery and sale operations
- `/staking/*` shows reward pools and wallet positions
- `/treasury` is restricted to treasury operations
- `/admin` is restricted to platform-level management flows

This separation helps readers understand that Arya is both:

- a protocol with on-chain rules
- a product with different user roles and operational responsibilities

## Token & Treasury Model

- ARYA total supply is planned at `100,000,000`.
- Treasury starts with `45,000,000 ARYA`.
- Initial treasury-seeded liquidity target is `500,000 ARYA` paired with `5,000 XLM`.
- `/token` is a public information surface for ARYA tokenomics, utility, and trustline instructions.
- `/treasury` is restricted to the treasury wallet and is intended for liquidity operations such as adding or removing `ARYA/XLM` liquidity.

## Event Sync

The frontend includes an event polling abstraction using Stellar RPC `getEvents` and is designed to refresh module state in near-real-time when the upgradeable contracts emit events. This is RPC polling, not a dedicated WebSocket stream.
