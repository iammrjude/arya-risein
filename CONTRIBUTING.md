# Contributing to AryaFund

Thank you for your interest in contributing to AryaFund! This document explains how to get started, how to report bugs, request features, and submit pull requests.

---

## Table of Contents

- [Contributing to AryaFund](#contributing-to-aryafund)
  - [Table of Contents](#table-of-contents)
  - [Code of Conduct](#code-of-conduct)
  - [Getting Started](#getting-started)
  - [Development Setup](#development-setup)
    - [Smart Contract (Rust + Soroban)](#smart-contract-rust--soroban)
    - [Frontend (React + Vite)](#frontend-react--vite)
  - [How to Contribute](#how-to-contribute)
    - [1. Find something to work on](#1-find-something-to-work-on)
    - [2. Make your changes](#2-make-your-changes)
    - [3. Test your changes](#3-test-your-changes)
    - [4. Commit and push](#4-commit-and-push)
    - [5. Open a Pull Request](#5-open-a-pull-request)
  - [Commit Message Format](#commit-message-format)
  - [Pull Request Process](#pull-request-process)
  - [Reporting Bugs](#reporting-bugs)
  - [Requesting Features](#requesting-features)
  - [Code Style](#code-style)
    - [Rust (Smart Contract)](#rust-smart-contract)
    - [JavaScript (Frontend)](#javascript-frontend)
  - [Questions](#questions)

---

## Code of Conduct

Be respectful and constructive. We welcome contributors of all experience levels. Harassment or dismissive behavior of any kind will not be tolerated.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/arya-fund.git
   cd arya-fund
   ```

3. **Create a branch** for your change:

   ```bash
   git checkout -b fix/your-fix-name
   # or
   git checkout -b feat/your-feature-name
   ```

---

## Development Setup

### Smart Contract (Rust + Soroban)

**Prerequisites:**

- Rust `1.84.0+`
- Stellar CLI `v25.1.0+`
- `wasm32v1-none` target

```bash
# Install wasm target
rustup target add wasm32v1-none

# Navigate to contract directory
cd contract

# Build the contract
stellar contract build

# Run tests (all 25 should pass)
cargo test --manifest-path=contracts/arya_fund/Cargo.toml
```

### Frontend (React + Vite)

**Prerequisites:**

- Node.js `v22+`
- A Stellar wallet extension (Freighter recommended for testnet)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Opens at `http://localhost:5173`

---

## How to Contribute

### 1. Find something to work on

- Check the [open issues](../../issues) for bugs and features
- Issues labeled `good first issue` are great for newcomers
- Comment on the issue to let others know you are working on it

### 2. Make your changes

- Keep changes focused — one fix or feature per pull request
- If fixing a bug, add a test that would have caught it
- If adding a feature, update the relevant README section

### 3. Test your changes

**Smart contract:**

```bash
cargo test --manifest-path=contract/contracts/arya_fund/Cargo.toml
```

All tests must pass before submitting.

**Frontend:**

```bash
cd frontend
npm run build
```

The build must complete without errors.

### 4. Commit and push

```bash
git add .
git commit -m "fix: short description of what you fixed"
git push origin your-branch-name
```

### 5. Open a Pull Request

- Go to your fork on GitHub and click **Compare & pull request**
- Fill in the PR description using the template below
- Link the related issue using `Closes #issue-number`

---

## Commit Message Format

Use the following format for all commits:

```bash
type: short description (max 72 characters)

Optional longer explanation of what changed and why.
Not needed for simple fixes.
```

**Types:**

| Type | When to use |
| ------ | ------------ |
| `fix` | Bug fix |
| `feat` | New feature |
| `test` | Adding or updating tests |
| `docs` | README, comments, documentation |
| `refactor` | Code change that is not a fix or feature |
| `chore` | Build process, dependencies, config |

**Examples:**

```bash
fix: cap donations at campaign goal amount
feat: add donor leaderboard to campaign page
test: add unit tests for donate and withdraw functions
docs: add screenshots to all README files
chore: add vercel.json for SPA routing
```

---

## Pull Request Process

Use this template when opening a pull request:

```markdown
## What does this PR do?
Brief description of the change.

## Related Issue
Closes #issue-number

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Test coverage
- [ ] Documentation update
- [ ] Refactor

## How to Test
Steps to verify the change works:
1. ...
2. ...

## Screenshots (if applicable)
Add before/after screenshots for UI changes.

## Checklist
- [ ] All tests pass
- [ ] Build completes without errors
- [ ] README updated if needed
- [ ] Commit messages follow the format in CONTRIBUTING.md
```

Pull requests will be reviewed and merged once approved. Please be patient and responsive to feedback.

---

## Reporting Bugs

[Open a GitHub Issue](../../issues/new/choose) with the `bug` label.

Use this structure:

```markdown
## Description
What is the bug?

## Steps to Reproduce
1. Go to ...
2. Click on ...
3. See error

## Expected Behavior
What should happen?

## Actual Behavior
What actually happens?

## Environment
- Browser:
- Wallet extension:
- Network: Stellar Testnet

## Screenshots
Add screenshots if helpful.
```

---

## Requesting Features

[Open a GitHub Issue](../../issues/new/choose) with the `enhancement` label.

Use this structure:

```markdown
## Feature Description
What would you like to see added?

## Problem it Solves
What problem does this feature address?

## Proposed Solution
How do you think it should work?

## Alternatives Considered
Any other approaches you thought about?
```

---

## Code Style

### Rust (Smart Contract)

- Format code before committing: `cargo fmt`
- All exported functions must have at least one test
- Use descriptive variable and function names
- Add comments for non-obvious logic

### JavaScript (Frontend)

- Use descriptive variable names
- Keep components focused — one responsibility per component
- Use CSS Modules for all styling — no inline styles
- Prefer `async/await` over `.then()` chains
- Handle all three wallet error types: not found, rejected, insufficient balance

---

## Questions

If you have a question that is not covered here, [open an issue](../../issues/new/choose) with the `question` label or start a [GitHub Discussion](../../discussions).
