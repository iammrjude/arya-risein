# Frontend Configuration

Copy:

```bash
cp frontend/.env.example frontend/.env
```

Or create `frontend/.env` manually on Windows.

## Required Values

- `VITE_REGISTRY_CONTRACT_ID`
- `VITE_CROWDFUNDING_CONTRACT_ID`
- `VITE_STAKING_CONTRACT_ID`
- `VITE_LAUNCHPAD_CONTRACT_ID`
- `VITE_ARYA_TOKEN_ID`
- `VITE_XLM_SAC_ID`
- `VITE_USDC_SAC_ID`
- `VITE_PLATFORM_OWNER`
- `VITE_READ_ACCOUNT`

## Optional Values

- `VITE_ERROR_TRACKING_ENDPOINT`

## Example

```env
VITE_REGISTRY_CONTRACT_ID=C...
VITE_CROWDFUNDING_CONTRACT_ID=C...
VITE_STAKING_CONTRACT_ID=C...
VITE_LAUNCHPAD_CONTRACT_ID=C...
VITE_ARYA_TOKEN_ID=C...
VITE_XLM_SAC_ID=C...
VITE_USDC_SAC_ID=C...
VITE_PLATFORM_OWNER=G...
VITE_READ_ACCOUNT=G...
VITE_ERROR_TRACKING_ENDPOINT=https://your-monitoring-endpoint.example/log
```

## Build After Updating

```bash
cd frontend
npm ci
npm run lint
npm run build
```

## Vercel

When deploying to Vercel:

1. add every `VITE_*` variable in project settings
2. point the build to the `frontend/` app
3. redeploy after changing any contract ID
