# Migration Strategy

The legacy `arya_fund` contract is not used as the long-term upgrade base.

## Safe migration approach

1. Leave old contract live for any existing campaigns.
2. Deploy the new upgradeable suite.
3. Initialize and register the new suite.
4. Point the frontend at the new registry and contract IDs.
5. Treat the legacy contract as read-only / legacy support.

This avoids risky in-place migration for a contract that was not originally designed around upgrade safety.
