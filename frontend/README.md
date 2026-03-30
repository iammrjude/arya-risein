# Arya Frontend

The frontend is a React application for the Arya platform. It keeps the dark purple visual identity from the original prototype while adding modular navigation, responsive layouts, event-based syncing, and production-focused configuration.

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
*Show a launchpad screen with project cards or sale details.*

### Staking Page

![Staking reward pool page](../screenshots/staking-page.png)
*Show the XLM and USDC staking pool UI.*

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

## Local Setup

```bash
cd frontend
npm ci
npm run lint
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

The frontend uses Stellar Wallets Kit. Depending on the user’s environment, they can connect with supported wallets such as Freighter, Albedo, xBull, Rabet, and LOBSTR-compatible flows supported by the package.

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
- frontend lint and production build pass locally
- bundle splitting is configured in `vite.config.js`

Large SDK chunks may still produce a warning because Stellar SDK is sizeable in browser builds, but the build completes successfully.

## Deployment

You said you will deploy on Vercel. Recommended flow:

1. set all `VITE_*` variables in Vercel project settings
2. connect the GitHub repo
3. deploy the `frontend/` app
4. copy the live URL into the root README
5. capture screenshots for the submission checklist

See [../docs/FRONTEND_CONFIGURATION.md](../docs/FRONTEND_CONFIGURATION.md) for contract env details.
