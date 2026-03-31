# Contributing to Arya

Thanks for contributing to Arya. This repo now covers a modular Stellar platform with upgradeable Soroban contracts, a React frontend, CI/CD, and deployment documentation.

Keeping `CONTRIBUTING.md` at the repo root is intentional because GitHub recognizes it automatically when contributors open issues or pull requests.

## What You Are Contributing To

Arya currently includes:

- `arya_registry`
- `arya_staking`
- `arya_crowdfunding`
- `arya_launchpad`
- legacy `arya_fund` kept only for migration/reference context
- React frontend under `frontend/`
- docs and deployment guides under `docs/`

## Getting Started

1. Fork the repository on GitHub.
1. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/arya-risein.git
cd arya-risein
```

1. Create a focused branch:

```bash
git checkout -b fix/short-description
```

or

```bash
git checkout -b feat/short-description
```

## Tooling

Recommended local shell:

- Git Bash for everyday development commands

Fallback:

- PowerShell for the Windows helper scripts

Required tooling:

- Rust stable
- `wasm32v1-none`
- Node.js `22+`
- Stellar CLI

Install the wasm target:

```bash
rustup target add wasm32v1-none
```

## Local Verification

### Contract workspace

```bash
cd contract
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo test --workspace
bash scripts/build-all.sh
```

Windows fallback:

```powershell
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File scripts/build-all.ps1
```

### Frontend Guidelines

```bash
cd frontend
npm ci
npm run lint
npm run test
npm run build
```

If your change affects runtime behavior, also run:

```bash
npm run dev
```

## Docs To Review Before Big Changes

- `README.md`
- `contract/README.md`
- `frontend/README.md`
- `docs/ARCHITECTURE.md`
- `docs/DEPLOYMENT.md`
- `docs/UPGRADES.md`
- `docs/MIGRATIONS.md`
- `docs/TESTNET_SETUP.md`

## How To Contribute

### 1. Keep changes focused

- one fix or feature per pull request
- avoid mixing refactors with unrelated behavior changes
- update docs when behavior or setup changes

### 2. Add or update tests when needed

- contract behavior changes should include or update Rust tests
- frontend behavior changes should include or update frontend tests when practical

### 3. Run the local checks before pushing

Minimum expectation:

- contract fmt
- contract clippy
- contract tests
- contract Wasm build
- frontend lint
- frontend tests
- frontend build

### 4. Use clear commit messages

Examples:

```bash
feat: add launchpad fee routing into staking
fix: correct staking reward pool accounting
docs: clarify github actions deploy variables
test: add shell navigation smoke tests
chore: update soroban sdk and ci workflow
```

## Pull Request Expectations

A good PR should include:

- a clear summary of what changed
- the reason for the change
- how it was tested
- screenshots for UI changes when relevant
- docs updates when setup, deployment, or behavior changes

Suggested PR structure:

```md
## Summary
What changed?

## Why
Why was this needed?

## Testing
- cargo fmt --all -- --check
- cargo clippy --workspace --all-targets --all-features -- -D warnings
- cargo test --workspace
- bash scripts/build-all.sh
- npm run lint
- npm run test
- npm run build

## Screenshots
If applicable
```

## Coding Style

### Rust

- keep exported contract behavior covered by tests
- prefer clear names over short clever ones
- use comments sparingly and only for non-obvious logic
- keep upgrade and admin paths explicit

### Frontend

- keep modules and pages focused
- preserve the current Arya visual identity
- keep navigation discoverable on desktop and mobile
- prefer readable state flow over premature abstraction

## Security And Secrets

- never commit secret keys
- never put signing material in normal GitHub Variables
- use GitHub Actions `Secrets` for signing keys
- use GitHub Actions `Variables` for public addresses, RPC URLs, contract IDs, and other non-sensitive values
- keep `.stellar/` out of version control

## Questions And Issues

If something is unclear:

- open an issue
- link the affected docs or file paths
- explain what you expected versus what you saw

If you are changing deployment, upgrade, or key-management flows, update the relevant docs in the same PR.
