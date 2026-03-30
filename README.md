# AryaFund

A decentralized crowdfunding dApp built on the Stellar network. Anyone can create campaigns, collect XLM donations, and receive automatic refunds if goals are not met — all enforced by smart contracts with no middleman.

- **Network:** Stellar Testnet
- **Live Demo:** <https://arya-crowdfund.vercel.app>
- **Demo Video Link:** <https://youtu.be/tANK_cpHt6E>

---

## Screenshots

### Test Output — 25 Tests Passing

![Test output showing 25 tests passing](screenshots/test-output.png)
*All 25 unit tests passing covering all 17 exported contract functions*

### Home Page — Wallet Not Connected

![Home page with no wallet connected](screenshots/home-disconnected.png)
*The home page as seen by a first-time visitor with no wallet connected. Campaign cards are visible and browsable without needing to connect a wallet.*

### Home Page — Wallet Connection Modal

![Wallet selection modal showing available wallet options](screenshots/home-wallet-modal.png)
*Clicking the Connect Wallet button opens the Stellar Wallets Kit modal, showing all supported wallets — Freighter, Albedo, xBull, Rabet, and LOBSTR.*

### Home Page — Wallet Connected

![Home page with wallet connected](screenshots/home-connected.png)
*The home page after successfully connecting a wallet. The connected address is displayed in the top right corner.*

### Create Campaign Page

![Empty campaign creation form](screenshots/create-empty.png)
*The campaign creation form where organizers can set a title, description, funding goal, deadline, and extension days.*

### Campaign Page — Active

![Campaign page showing active state](screenshots/campaign-active-donate-form.png)
*A campaign that is active, goal has not been met and the deadline has not passed. The donate form is available and users can donate by typing the amount they want to donate.*

### Campaign Page — Goal Reached

![Campaign page showing goal reached state](screenshots/campaign-goal-reached.png)
*A campaign that has reached 100% of its funding goal. The donate form is replaced with a Goal Reached message, and the organizer can now withdraw funds from their dashboard.*

### Campaign Page — Successful

![Campaign page showing successful state](screenshots/campaign-successful.png)
*A campaign that has reached 100% of its funding goal. The donate form is replaced with a Campaign Successful message, which means that funds have been withdrawn by the organizer.*

### Dashboard — No Campaigns

![Dashboard page with no campaigns yet](screenshots/dashboard-no-campaigns.png)
*The organizer dashboard when the connected wallet has not yet created any campaigns.*

### Dashboard — With Campaigns

![Dashboard page with one or more campaigns](screenshots/dashboard-with-campaigns.png)
*The organizer dashboard when the connected wallet has created one or more campaigns.*

### Admin Page — Wallet Disconnected

![Admin page prompting the user to connect their wallet to access the admin panel](screenshots/admin-disconnected.png)
*The admin page when the user has not yet connected their wallet. It prompts the user to connect their wallet to access the admin panel.*

### Admin Page — Access Denied

![Admin page showing access denied for non-owner wallet](screenshots/admin-access-denied.png)
*The admin page when accessed by a wallet that is not the platform owner. Access is restricted to protect platform settings.*

### Admin Page — Admin Panel

![Admin page showing the admin panel for owner wallet](screenshots/admin-panel.png)
*The admin page when accessed by the platform owner's wallet. It shows the Platform Settings card - which shows the settings that the platform owner can update. It also shows the All Campaigns card - which shows all the campaigns on the platform.*

---

## How It Works

1. **Create** a campaign with a goal, deadline, and optional extension days
2. **Donate** XLM to any active campaign
3. **Goal met** → organizer withdraws funds (2.5% platform fee deducted)
4. **Goal not met** → campaign fails, donors claim full refunds automatically

### The 70% Rule

If a campaign raises 70%+ but misses its deadline, the organizer gets a 7-day action window to either extend the deadline (one time) or mark the campaign as failed. If they do nothing, it auto-fails and donors can claim refunds.

---

## Repository Structure

```text
arya-fund/
├── contract/     # Soroban smart contract (Rust)
│   ├── contracts/
│   │   └── arya_fund/
│   │       ├── src/
│   │       │   ├── lib.rs      # 17 exported functions
│   │       │   └── test.rs     # 25 unit tests
│   │       └── Cargo.toml
│   ├── Cargo.toml
│   └── README.md
│
└── frontend/     # React frontend
    ├── src/
    │   ├── contract/       # Contract client and config
    │   ├── hooks/          # useWallet, useContract
    │   ├── utils/          # Formatting, time, stellar helpers
    │   ├── components/     # Reusable UI components
    │   └── pages/          # Home, Campaign, Create, Dashboard, Admin
    ├── package.json
    └── README.md
```

---

## Contract

| Property | Value |
| ---------- | ------- |
| **Contract Address** | `CD5LOATI5SDME7GQXRBVSZIG3DZL4NRYD4663GM7PLPY252L2RGPOFTL` |
| **Network** | Stellar Testnet |
| **Platform Fee** | 2.5% on successful withdrawals |
| **Action Window** | 7 days |
| **Deploy TX** | `95478ead278154ae67b279cdce1492715f2e37079d5ed41253710dbc017e2ab6` |
| **Init TX** | `8e29274c189a60e436da4d2c8aa807a3472ecc7584ad69a6891286312b69e64b` |

### Verified Contract Calls

| Action | Transaction |
| -------- | ------------- |
| Create Campaign (1000 XLM goal) | [`aed99ba9...`](https://stellar.expert/explorer/testnet/tx/aed99ba9f25edd405b96baf142e1fb77dd6c3f388b53f0a3c66188ca7457bd47) |
| Donate 120 XLM | [`ca0e0fd7...`](https://stellar.expert/explorer/testnet/tx/ca0e0fd7ebc7b446ac4d0b7de8e6164490cb343bb5a59c6d8c5c3e3262c78599) |
| Donate 500 XLM | [`970d73e8...`](https://stellar.expert/explorer/testnet/tx/970d73e8cf8c5aba408e1da4b1a2cb9c2141c123d69bff8b11a0bb7ca607208a) |
| Donate 80 XLM | [`98020ff7...`](https://stellar.expert/explorer/testnet/tx/98020ff70c1d55eb0855efed99fe0511f85a5c50d0e1a8b051bf699b890b4ea0) |
| Donate 300 XLM | [`27c954cd...`](https://stellar.expert/explorer/testnet/tx/27c954cde49216022b05caa7bf4ebb802f570ee1b8fe55b9d27dec0580a5f853) |
| Update Fee to 2% | [`4586967e...`](https://stellar.expert/explorer/testnet/tx/4586967eff85adcf713a2441a1d122030343eac5f2a5c2b6d5edb69e8940ebd5) |
| Update Action Window to 5 days | [`4f4691ed...`](https://stellar.expert/explorer/testnet/tx/4f4691ed1ed72b78977348c6ffc023888bc1820dce30c0a8408f4f5b1f0c4f0e) |

---

## Tech Stack

### Smart Contract

- **Rust** + Soroban SDK
- Stellar CLI v25.1.0
- `wasm32v1-none` target

### Frontend

- React 19 + Vite
- React Router v7
- `@stellar/stellar-sdk` v14
- `@creit-tech/stellar-wallets-kit` v2 (Freighter, Albedo, xBull, Rabet, LOBSTR)
- CSS Modules

---

## Getting Started

### Run the Smart Contract

```bash
cd contract

# Build
stellar contract build

# Test
cargo test --manifest-path=contracts/arya_fund/Cargo.toml
```

See [contract/README.md](contract/README.md) for full deployment instructions.

### Run the Frontend

```bash
cd frontend

# Install
npm install

# Run locally
npm run dev
```

Opens at `http://localhost:5173`

See [frontend/README.md](frontend/README.md) for full setup details.

---

## Features

- [x] Create trustless crowdfunding campaigns on Stellar
- [x] Donate XLM to any active campaign
- [x] Smart contract enforced refunds on failed campaigns
- [x] Organizer dashboard — withdraw, extend deadline, mark failed
- [x] Platform admin panel — fee, treasury, action window management
- [x] Multi-wallet support via Stellar Wallets Kit
- [x] Real-time countdown timers and progress bars
- [x] Transaction status feedback with Stellar Explorer links

---

## Security Design

- Funds held by contract, never by the organizer
- Pull refunds — donors claim themselves, no double claiming possible
- Platform owner and treasury are separate wallets
- Every write function requires `.require_auth()` from the appropriate party
- All funding rules enforced on-chain

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

To report a bug or request a feature, [open an issue](../../issues/new/choose).

---

## Links

- [Stellar Expert — Contract](https://stellar.expert/explorer/testnet/contract/CD5LOATI5SDME7GQXRBVSZIG3DZL4NRYD4663GM7PLPY252L2RGPOFTL)
- [Contract Explorer — Contract info, Invoke contract](https://lab.stellar.org/r/testnet/contract/CD5LOATI5SDME7GQXRBVSZIG3DZL4NRYD4663GM7PLPY252L2RGPOFTL)
- [Stellar Expert — Deploy TX](https://stellar.expert/explorer/testnet/tx/95478ead278154ae67b279cdce1492715f2e37079d5ed41253710dbc017e2ab6)
- [Stellar Expert — Init TX](https://stellar.expert/explorer/testnet/tx/8e29274c189a60e436da4d2c8aa807a3472ecc7584ad69a6891286312b69e64b)
- [Soroban Docs](https://soroban.stellar.org)
- [Stellar Wallets Kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit)
- [Attestation Verification Flow](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0055.md#attestation-verification-flow)
