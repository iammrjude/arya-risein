# Arya Frontend

The frontend is a React application for the Arya platform. It keeps the established Arya visual identity while adding modular navigation, responsive layouts, wallet-powered contract interactions, and production-focused configuration.

## Modules

- Home
- Crowdfunding
- Launchpad
- Staking
- Admin

## Screenshots

Add screenshots after deployment.

### Landing Page

![Arya landing page](../screenshots/home-page.png)
*Use a full-page screenshot showing the main Arya landing experience.*

### Mobile Menu

![Arya mobile menu](../screenshots/mobile-menu.png)
*Show the mobile navigation drawer or hamburger menu open.*

### Crowdfunding Dashboard

![Crowdfunding dashboard](../screenshots/crowdfunding-dashboard.png)
*Show the module tabs and dashboard experience on a populated account.*

### Launchpad Page

![Launchpad page](../screenshots/launchpad-page.png)
*Show a launchpad screen with live sale metrics or the project detail flow.*

### Staking Page

![Staking reward pool page](../screenshots/staking-page.png)
*Show the staking overview, reward pool metrics, or position dashboard.*

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
- `/staking/overview`
- `/admin`

## Local Setup

```bash
cd frontend
npm ci
npm run lint
npm run test
npm run build
npm run dev
```

Local dev server:

```text
http://localhost:5173
```

## Environment Variables

Copy:

```bash
cp .env.example .env
```

Then configure:

- `VITE_REGISTRY_CONTRACT_ID`
- `VITE_CROWDFUNDING_CONTRACT_ID`
- `VITE_STAKING_CONTRACT_ID`
- `VITE_LAUNCHPAD_CONTRACT_ID`
- `VITE_ARYA_TOKEN_ID`
- `VITE_XLM_SAC_ID`
- `VITE_USDC_SAC_ID`
- `VITE_PLATFORM_OWNER`
- `VITE_READ_ACCOUNT`
- `VITE_ERROR_TRACKING_ENDPOINT`

## Wallet Integration

The frontend uses Stellar Wallets Kit. Supported wallet flows depend on the user's environment and the installed wallet extensions or apps.

## Contract Coverage

- Crowdfunding: browse, create, donate, withdraw, extend, mark failed, claim refund, admin settings
- Launchpad: browse sales, create sale, contribute, claim tokens, claim refund, withdraw funds, reclaim unsold tokens
- Staking: overview metrics, reward pool metrics, stake, unstake, claim rewards, position tracking
- Registry: admin visibility into the canonical on-chain contract addresses and treasury configuration

## Real-Time Sync

The frontend includes a Soroban RPC event hook:

- [useEventStream.js](./src/hooks/useEventStream.js)
- [events.js](./src/contract/events.js)

This keeps the UI ready for real-time updates as new contract events arrive.

## Error Tracking

Browser-side monitoring lives in:

- [monitoring.js](./src/lib/monitoring.js)

Set `VITE_ERROR_TRACKING_ENDPOINT` to forward browser errors to your own endpoint.

## Mobile Responsiveness

The app is designed to remain discoverable on small screens:

- hamburger navigation for top-level modules
- visible module tabs inside active sections
- responsive card and grid layouts
- route structure that keeps key pages reachable on mobile

## Production Build Notes

- Vite is pinned to the stable `7.x` line
- frontend lint, tests, and production build pass locally
- bundle splitting is configured in `vite.config.js`

Large SDK chunks may still produce a warning because Stellar SDK is sizable in browser builds, but the build completes successfully.

## Deployment

Recommended flow:

1. set all `VITE_*` variables in Vercel project settings
2. connect the GitHub repo
3. deploy the `frontend/` app
4. copy the live URL into the root README
5. capture screenshots for the submission checklist

Recommended split of responsibilities:

- GitHub Actions: lint, test, build, contract validation, contract deployment workflow
- Vercel: frontend hosting and frontend preview and production deploys

See [../docs/FRONTEND_CONFIGURATION.md](../docs/FRONTEND_CONFIGURATION.md) for contract env details.
