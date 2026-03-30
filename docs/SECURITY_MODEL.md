# Security Model

- All new contracts are upgradeable by owner only.
- Treasury and staking fee split are explicit.
- Crowdfunding and launchpad use single-asset flows to reduce accounting complexity.
- Staking uses separated XLM / USDC reward pools.
- Leveraged staking is intentionally excluded from current implementation.
- Frontend configuration is env-driven, not hardcoded per deployment.
