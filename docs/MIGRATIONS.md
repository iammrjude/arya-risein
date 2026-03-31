# Crowdfunding Contract Path

`arya_crowdfunding` is the canonical crowdfunding contract for Arya.

The repository and frontend now target the upgradeable suite directly:

1. deploy the registry, staking, crowdfunding, and launchpad contracts
2. initialize the suite with the current token and treasury addresses
3. point the frontend at the new registry and contract IDs
4. use `arya_crowdfunding` for all crowdfunding reads and writes going forward
