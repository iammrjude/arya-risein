# Arya

Arya is a modular Stellar dApp platform built for Level 4 production-readiness work. It expands the original crowdfunding prototype into a broader product suite with upgradeable Soroban smart contracts, a React frontend, real-time event syncing, CI/CD, and mobile-first navigation.

- Network: `Stellar Testnet`
- Live Demo: `ADD_VERCEL_URL_HERE`
- Demo Video: `ADD_VIDEO_URL_HERE`
- Repository: <https://github.com/iammrjude/arya-risein>

## Modules

- Crowdfunding
- Launchpad
- Staking
- Admin

Coming soon:

- Leveraged staking

## Screenshots

Add screenshots in the `screenshots/` folder and replace the placeholder filenames below.

### Mobile Responsive View

![Mobile responsive Arya layout](screenshots/mobile-responsive.png)
*Show the mobile navigation, module tabs, and a complete page rendered on a narrow screen.*

### Home Page

![Arya landing page](screenshots/home-page.png)
*The Arya landing page introducing crowdfunding, launchpad, staking, and platform status.*

### Crowdfunding Explore

![Crowdfunding explore page](screenshots/crowdfunding-explore.png)
*The crowdfunding browse page showing campaigns, progress cards, and responsive layout.*

### Launchpad Explore

![Launchpad explore page](screenshots/launchpad-explore.png)
*The launchpad browse page showing sales, project metadata, and status information.*

### Staking Dashboard

![Staking dashboard page](screenshots/staking-dashboard.png)
*The staking area showing reward pools, balances, and user-facing staking actions.*

### CI/CD Pipeline

![GitHub Actions pipeline passing](screenshots/ci-pipeline.png)
*A screenshot or badge proving the CI pipeline passed after the latest push.*

### Contract Test Output

![Contract tests passing](screenshots/contract-tests.png)
*Rust test output showing the contract workspace tests passing.*

## How It Works

1. Crowdfunding campaigns accept exactly one asset: `XLM` or `USDC`.
2. Launchpad sales also accept exactly one asset: `XLM` or `USDC`.
3. ARYA is the staking asset. Users stake ARYA to earn platform rewards.
4. When crowdfunding or launchpad collects protocol fees, the fee is split automatically:
   - part to treasury
   - part to staking rewards
5. Staking keeps separate reward pools for `XLM` and `USDC`.
6. Registry stores the live contract addresses and shared protocol configuration.
7. All new contracts expose an `upgrade` entrypoint for safe testnet iteration.

## Advanced Production Features

- Upgradeable Soroban contracts
- Inter-contract reward routing from crowdfunding and launchpad into staking
- Real-time frontend event syncing through Soroban RPC event polling
- Mobile-first responsive navigation
- CI/CD with Rust and frontend validation
- Frontend smoke tests with Vitest and Testing Library
- Error reporting hook in the frontend
- Wasm build verification for deployable contracts

## Repository Structure

```text
arya-risein/
|-- contract/
|   |-- contracts/
|   |   |-- arya_fund/           # legacy baseline contract kept for migration context
|   |   |-- arya_registry/       # shared address registry and config
|   |   |-- arya_staking/        # ARYA staking with XLM and USDC reward pools
|   |   |-- arya_crowdfunding/   # single-asset campaigns + staking fee split
|   |   `-- arya_launchpad/      # single-asset sales + staking fee split
|   |-- scripts/
|   |   |-- build-all.ps1
|   |   |-- build-all.sh
|   |   |-- deploy-testnet.ps1
|   |   |-- deploy-or-upgrade-testnet.sh
|   |   |-- init-testnet.ps1
|   |   `-- upgrade-testnet.ps1
|   `-- README.md
|-- docs/
|   |-- ARCHITECTURE.md
|   |-- DEPLOYMENT.md
|   |-- UPGRADES.md
|   |-- MIGRATIONS.md
|   |-- TESTNET_SETUP.md
|   |-- FRONTEND_CONFIGURATION.md
|   |-- FEE_FLOW.md
|   |-- STAKING_DESIGN.md
|   |-- LAUNCHPAD_DESIGN.md
|   `-- SECURITY_MODEL.md
|-- frontend/
|   |-- src/
|   |   |-- app/
|   |   |-- components/
|   |   |-- contract/
|   |   |-- hooks/
|   |   |-- modules/
|   |   `-- lib/
|   `-- README.md
|-- screenshots/
`-- CONTRIBUTING.md
```

## Contracts

| Property | Value |
| ---------- | ------- |
| Network | Stellar Testnet |
| Registry Contract | `ADD_REGISTRY_ID_HERE` |
| Staking Contract | `ADD_STAKING_ID_HERE` |
| Crowdfunding Contract | `ADD_CROWDFUNDING_ID_HERE` |
| Launchpad Contract | `ADD_LAUNCHPAD_ID_HERE` |
| ARYA Token / SAC | `ADD_ARYA_TOKEN_ID_HERE` |
| Native XLM SAC | `ADD_XLM_SAC_ID_HERE` |
| Testnet USDC SAC | `ADD_USDC_SAC_ID_HERE` |
| Treasury Wallet | `ADD_TREASURY_ADDRESS_HERE` |
| Platform Owner | `ADD_OWNER_ADDRESS_HERE` |

### Deployment / Upgrade Transactions

| Action | Transaction Hash |
| ---------- | ---------------- |
| Registry Deploy | `ADD_TX_HASH_HERE` |
| Registry Initialize | `ADD_TX_HASH_HERE` |
| Staking Deploy | `ADD_TX_HASH_HERE` |
| Staking Initialize | `ADD_TX_HASH_HERE` |
| Crowdfunding Deploy | `ADD_TX_HASH_HERE` |
| Crowdfunding Initialize | `ADD_TX_HASH_HERE` |
| Launchpad Deploy | `ADD_TX_HASH_HERE` |
| Launchpad Initialize | `ADD_TX_HASH_HERE` |
| Latest Upgrade | `ADD_TX_HASH_HERE` |

### Inter-Contract Call Verification

| Action | Transaction |
| ---------- | ------------ |
| Crowdfunding fee routed into staking | `ADD_TX_HASH_OR_EXPLORER_LINK` |
| Launchpad fee routed into staking | `ADD_TX_HASH_OR_EXPLORER_LINK` |

### Token / Pool

| Asset | Address |
| ---------- | ------- |
| ARYA token / SAC | `ADD_TOKEN_ID_HERE` |
| ARYA/XLM pool (optional) | `ADD_POOL_ID_HERE` |

## Tech Stack

### Smart Contract Stack

- Rust 2024 edition
- Soroban SDK `25.3.0`
- Stellar CLI GitHub Action `stellar/stellar-cli@v23.3.0`
- `wasm32v1-none`

### Frontend

- React `19`
- React Router `7`
- Vite `7`
- Vitest + Testing Library
- `@stellar/stellar-sdk`
- `@creit-tech/stellar-wallets-kit`
- CSS Modules

## Local Development

### Contract Commands

```bash
cd contract
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo test --workspace
bash scripts/build-all.sh
```

Build deployable Wasm with the Windows helper:

```powershell
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File scripts/build-all.ps1
```

### Frontend App

```bash
cd frontend
npm ci
npm run lint
npm run test
npm run build
npm run dev
```

## Documentation

- [contract/README.md](contract/README.md)
- [frontend/README.md](frontend/README.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/UPGRADES.md](docs/UPGRADES.md)
- [docs/MIGRATIONS.md](docs/MIGRATIONS.md)
- [docs/TESTNET_SETUP.md](docs/TESTNET_SETUP.md)
- [docs/FRONTEND_CONFIGURATION.md](docs/FRONTEND_CONFIGURATION.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## CI/CD

CI means `Continuous Integration`: every push or pull request runs automated checks so broken code is caught early.

CD means `Continuous Deployment` or `Continuous Delivery`: after validation passes, the deployment workflow can publish or upgrade the contracts on testnet.

GitHub Actions workflows:

- [ci.yml](.github/workflows/ci.yml)
  Runs Rust format, clippy, tests, Wasm builds, and frontend lint/test/build.
- [testnet-deploy.yml](.github/workflows/testnet-deploy.yml)
  Automatically deploys on the first run and upgrades on later runs when stored contract ID variables are present.

Add a badge or screenshot here after the first passing run.

### Can I Use Git Bash Instead of PowerShell?

Yes. For day-to-day development, Git Bash is a good default shell and matches the Linux-based GitHub Actions runners more closely.

Recommended Git Bash contract commands:

```bash
cd contract
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo test --workspace
bash scripts/build-all.sh
```

PowerShell helper scripts are still kept in the repo as a Windows-friendly fallback for local deployment flows.

### What You Need To Configure On GitHub

Yes, you do need some repository setup on GitHub before CI/CD can work properly.

Required repository setup:

1. push this repo to GitHub
2. open `Settings -> Actions -> General`
3. make sure GitHub Actions is enabled for the repository
4. open `Settings -> Secrets and variables -> Actions`
5. add the required secret and variables listed below

Recommended but optional:

- protect `main` and require the `CI` workflow before merge
- keep deployment only on `main`
- leave testnet deploy variables empty until the first deployment run

### GitHub Actions Variables

`ci.yml` does not require custom secrets for normal validation. It only needs the repository code.

`testnet-deploy.yml` does require GitHub Actions secrets. In GitHub:

1. open your repository
2. go to `Settings`
3. go to `Secrets and variables` -> `Actions`
4. add the signing key as a repository secret
5. add the public configuration values as repository variables

GitHub Actions Secret:

- `STELLAR_ACCOUNT`
  Set this to a signing key the CLI can use on the runner. In GitHub Actions, the safest practical value is your Stellar secret key beginning with `SC...`, not a local alias like `arya-admin`.

GitHub Actions Variables:

- `STELLAR_RPC_URL`
  Set to `https://soroban-testnet.stellar.org`
- `STELLAR_NETWORK_PASSPHRASE`
  Set to `Test SDF Network ; September 2015`
- `ARYA_PLATFORM_OWNER`
  The public Stellar address `G...` that should own the Arya contracts.
- `ARYA_TREASURY`
  The treasury public Stellar address `G...`.
- `ARYA_TOKEN_SAC_ID`
  The ARYA token Stellar Asset Contract ID `C...`.
- `ARYA_USDC_SAC_ID`
  The USDC Stellar Asset Contract ID `C...` used on your testnet setup.
- `ARYA_XLM_SAC_ID`
  Optional explicit native XLM SAC override if you want to provide it instead of letting the scripts derive it.

Used to detect that the suite has already been deployed and should now upgrade:

- `ARYA_REGISTRY_ID`
- `ARYA_STAKING_ID`
- `ARYA_CROWDFUNDING_ID`
- `ARYA_LAUNCHPAD_ID`

Important notes:

- never put secret keys in normal repository variables or commit them to the repo
- only store signing material in GitHub Actions `Secrets`
- use GitHub Actions `Variables` for public addresses, contract IDs, RPC URLs, and passphrases
- on the first workflow run, leave the contract ID variables empty so the workflow performs a fresh deploy
- after the first deploy succeeds, copy the printed contract IDs into the four GitHub repository variables above so future runs automatically use the upgrade path

### Frontend Deployment And CI/CD

You do not need GitHub Actions to deploy the frontend to Vercel.

Recommended setup:

1. import the GitHub repo into Vercel
2. point Vercel at the `frontend/` app
3. add the `VITE_*` environment variables in Vercel
4. let Vercel handle frontend deployments on push

So in this project:

- GitHub Actions handles validation and testnet contract deployment
- Vercel can handle frontend deployment independently

## Submission Checklist

- [x] Public GitHub repository
- [x] 8+ meaningful commits
- [x] Upgradeable contracts
- [x] Inter-contract calls
- [x] Mobile-responsive frontend
- [x] Real-time event stream hook
- [x] CI/CD workflows configured
- [x] Frontend smoke tests configured
- [ ] Live demo URL filled in
- [ ] Screenshots added
- [ ] Contract addresses added
- [ ] Transaction hashes added
- [ ] Token / pool address added if deployed

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.
