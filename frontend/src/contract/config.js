import { Networks } from '@stellar/stellar-sdk'

const env = import.meta.env

export const CROWDFUNDING_CONTRACT_ID = env.VITE_CROWDFUNDING_CONTRACT_ID || ''
export const REGISTRY_CONTRACT_ID = env.VITE_REGISTRY_CONTRACT_ID || ''
export const STAKING_CONTRACT_ID = env.VITE_STAKING_CONTRACT_ID || ''
export const LAUNCHPAD_CONTRACT_ID = env.VITE_LAUNCHPAD_CONTRACT_ID || ''
export const NATIVE_TOKEN_ID = env.VITE_XLM_SAC_ID || ''
export const USDC_TOKEN_ID = env.VITE_USDC_SAC_ID || ''
export const ARYA_TOKEN_ID = env.VITE_ARYA_TOKEN_ID || ''
export const NETWORK_PASSPHRASE = env.VITE_NETWORK_PASSPHRASE || Networks.TESTNET
export const RPC_URL = env.VITE_RPC_URL || 'https://soroban-testnet.stellar.org'
export const HORIZON_URL = env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org'
export const PLATFORM_OWNER = env.VITE_PLATFORM_OWNER || ''
export const READ_ACCOUNT = env.VITE_READ_ACCOUNT || PLATFORM_OWNER
