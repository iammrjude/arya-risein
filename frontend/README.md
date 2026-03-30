# Arya Frontend

The frontend is a React + Vite application for the Arya platform.

## Modules

- Home
- Crowdfunding
- Launchpad
- Staking
- Admin

## Commands

```bash
npm ci
npm run lint
npm run build
npm run dev
```

## Environment

Copy `.env.example` to `.env` and configure:

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

## Real-time sync

The frontend includes a lightweight event stream hook built on Stellar RPC `getEvents`. As the new upgradeable contracts are deployed and emit events, the UI can react to on-chain updates instead of relying only on manual refreshes.

## Error tracking

`src/lib/monitoring.js` provides client-side error reporting hooks. Configure `VITE_ERROR_TRACKING_ENDPOINT` if you want browser errors to be forwarded to your monitoring endpoint.

## Mobile responsiveness

The app shell and route structure are designed for mobile-first discoverability:

- hamburger menu for top-level modules
- visible module tabs inside active product sections
- reusable responsive cards and sections
