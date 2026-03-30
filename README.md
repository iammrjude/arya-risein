# Arya

Arya is a modular Stellar dApp platform featuring crowdfunding, launchpad, and ARYA staking with upgradeable Soroban smart contracts and a React frontend.

## Modules

- Crowdfunding
- Launchpad
- Staking
- Admin

Coming soon:

- Leveraged staking

## Architecture

Arya is split into:

- `contract/`
  Upgradeable Soroban contracts and testnet deployment scripts.
- `frontend/`
  React + Vite application with a modular route structure.
- `docs/`
  Deployment, upgrade, migration, architecture, and operations docs.

## Contracts

Implemented upgradeable contracts:

- `arya_registry`
- `arya_staking`
- `arya_crowdfunding`
- `arya_launchpad`

ARYA token is intended to be issued as a Stellar asset / Stellar Asset Contract and then referenced by the contracts and frontend configuration.

## Key Design Choices

- Single-asset crowdfunding campaigns: XLM or USDC per campaign
- Single-asset launchpad sales: XLM or USDC per sale
- Fee sharing from crowdfunding and launchpad into staking
- Separate staking reward pools for XLM and USDC
- Upgradeability designed in from day one for the new contract suite

## Frontend Routes

- `/`
- `/crowdfunding`
- `/crowdfunding/create`
- `/crowdfunding/campaign/:id`
- `/crowdfunding/dashboard`
- `/launchpad`
- `/launchpad/create`
- `/launchpad/project/:id`
- `/launchpad/dashboard`
- `/staking/xlm`
- `/staking/usdc`
- `/staking/dashboard`
- `/admin`

## Development

### Contracts

```bash
cd contract
cargo test --workspace
```

### Frontend

```bash
cd frontend
npm ci
npm run lint
npm run build
```

## Deployment and Operations

See:

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/UPGRADES.md](docs/UPGRADES.md)
- [docs/MIGRATIONS.md](docs/MIGRATIONS.md)
- [docs/FRONTEND_CONFIGURATION.md](docs/FRONTEND_CONFIGURATION.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## CI/CD

GitHub Actions included:

- `.github/workflows/ci.yml`
  Runs contract tests and frontend lint/build on pushes and PRs
- `.github/workflows/testnet-deploy.yml`
  Supports testnet deploy or upgrade flows when secrets are configured

## Submission Notes

Fill these in after testnet deployment / frontend deployment:

- Live demo URL:
- Mobile responsive screenshot:
- CI/CD badge or screenshot:
- Registry contract address:
- Crowdfunding contract address:
- Staking contract address:
- Launchpad contract address:
- ARYA token / SAC address:
- XLM / USDC pool address (if created):
- Deployment transaction hashes:
- Upgrade transaction hashes:
