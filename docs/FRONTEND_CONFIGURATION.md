# Frontend Configuration

Copy `frontend/.env.example` to `.env`.

Set:

- `VITE_REGISTRY_CONTRACT_ID`
- `VITE_CROWDFUNDING_CONTRACT_ID`
- `VITE_STAKING_CONTRACT_ID`
- `VITE_LAUNCHPAD_CONTRACT_ID`
- `VITE_ARYA_TOKEN_ID`
- `VITE_XLM_SAC_ID`
- `VITE_USDC_SAC_ID`
- `VITE_PLATFORM_OWNER`
- `VITE_READ_ACCOUNT`

Then rebuild:

```bash
cd frontend
npm ci
npm run build
```
