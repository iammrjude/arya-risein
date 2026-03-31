import {
    Address,
    BASE_FEE,
    Contract,
    TransactionBuilder,
    nativeToScVal,
    rpc,
    scValToNative,
    xdr,
} from '@stellar/stellar-sdk'
import {
    ARYA_TOKEN_ID,
    CROWDFUNDING_CONTRACT_ID,
    LAUNCHPAD_CONTRACT_ID,
    NETWORK_PASSPHRASE,
    READ_ACCOUNT,
    REGISTRY_CONTRACT_ID,
    STAKING_CONTRACT_ID,
} from './config'
import { rpcServer } from './server'
import { normalizeContractEnum } from '../utils/format'

const server = rpcServer

function getCrowdfundingContract() {
    return new Contract(CROWDFUNDING_CONTRACT_ID)
}

function getStakingContract() {
    requireContractId(STAKING_CONTRACT_ID, 'Staking')
    return new Contract(STAKING_CONTRACT_ID)
}

function getLaunchpadContract() {
    requireContractId(LAUNCHPAD_CONTRACT_ID, 'Launchpad')
    return new Contract(LAUNCHPAD_CONTRACT_ID)
}

function getRegistryContract() {
    requireContractId(REGISTRY_CONTRACT_ID, 'Registry')
    return new Contract(REGISTRY_CONTRACT_ID)
}

function addressToScVal(address) {
    return nativeToScVal(Address.fromString(address), { type: 'address' })
}

function u32ToScVal(value) {
    return nativeToScVal(Number(value), { type: 'u32' })
}

function i128ToScVal(value) {
    return nativeToScVal(BigInt(value), { type: 'i128' })
}

function u64ToScVal(value) {
    return nativeToScVal(BigInt(value), { type: 'u64' })
}

function stringToScVal(value) {
    return nativeToScVal(value, { type: 'string' })
}

function symbolToScVal(value) {
    return nativeToScVal(value, { type: 'symbol' })
}

function unitEnumToScVal(value) {
    return xdr.ScVal.scvVec([symbolToScVal(normalizeContractEnum(value))])
}

async function simulateAndPrepare(sourceAddress, operation) {
    const account = await server.getAccount(sourceAddress)
    const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(operation)
        .setTimeout(180)
        .build()

    const simResult = await server.simulateTransaction(tx)
    if (simResult.error) {
        throw new Error(`Simulation failed: ${simResult.error}`)
    }

    const prepared = rpc.assembleTransaction(tx, simResult).build()
    return prepared.toEnvelope().toXDR('base64')
}

async function simulateRead(contract, method, ...args) {
    const account = await server.getAccount(READ_ACCOUNT)
    const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build()

    const result = await server.simulateTransaction(tx)
    if (result.error) {
        throw new Error(result.error)
    }
    return scValToNative(result.result.retval)
}

async function submitSigned(signedXdr) {
    const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
    const result = await server.sendTransaction(tx)

    if (result.status === 'ERROR') {
        throw new Error(`Transaction failed: ${JSON.stringify(result.errorResult)}`)
    }

    let attempts = 0
    while (attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        const status = await server.getTransaction(result.hash)
        if (status.status === 'SUCCESS') {
            return { success: true, hash: result.hash, result: status }
        }
        if (status.status === 'FAILED') {
            throw new Error('Transaction failed on chain')
        }
        attempts++
    }

    throw new Error('Transaction confirmation timeout')
}

function normalizeCampaign(campaign) {
    return {
        ...campaign,
        status: normalizeContractEnum(campaign.status),
        funding_asset: normalizeContractEnum(campaign.funding_asset),
    }
}

function normalizeSale(sale) {
    return {
        ...sale,
        status: normalizeContractEnum(sale.status),
        funding_asset: normalizeContractEnum(sale.funding_asset),
    }
}

function normalizePool(pool) {
    return { ...pool }
}

function normalizePosition(position) {
    return { ...position }
}

function normalizeCrowdfundingSettings(settings) {
    return { ...settings }
}

function normalizeLaunchpadSettings(settings) {
    return { ...settings }
}

function normalizeRegistryConfig(config) {
    return { ...config }
}

function requireContractId(contractId, name) {
    if (!contractId) {
        throw new Error(`${name} contract ID is not configured`)
    }
}

function requireTokenId(tokenId, name) {
    if (!tokenId) {
        throw new Error(`${name} token ID is not configured`)
    }
}

export async function getCampaignCount() {
    return simulateRead(getCrowdfundingContract(), 'get_campaign_count')
}

export async function getCampaign(campaignId) {
    const campaign = await simulateRead(getCrowdfundingContract(), 'get_campaign', u32ToScVal(campaignId))
    return normalizeCampaign(campaign)
}

export async function getCampaigns() {
    const count = await getCampaignCount()
    const campaigns = []
    for (let i = 0; i < count; i++) {
        try {
            campaigns.push(await getCampaign(i))
        } catch {
            // Skip missing campaign slots.
        }
    }
    return campaigns
}

export async function getDonorAmount(campaignId, donorAddress) {
    return simulateRead(
        getCrowdfundingContract(),
        'get_donor_amount',
        u32ToScVal(campaignId),
        addressToScVal(donorAddress),
    )
}

export async function isCampaignFailed(campaignId) {
    return simulateRead(getCrowdfundingContract(), 'is_campaign_failed', u32ToScVal(campaignId))
}

export async function isRefundClaimed(campaignId, donorAddress) {
    return simulateRead(
        getCrowdfundingContract(),
        'is_refund_claimed',
        u32ToScVal(campaignId),
        addressToScVal(donorAddress),
    )
}

export async function getPlatformSettings() {
    const settings = await simulateRead(getCrowdfundingContract(), 'get_platform_settings')
    return normalizeCrowdfundingSettings(settings)
}

export async function createCampaign({
    organizerAddress,
    title,
    description,
    goalAmount,
    deadline,
    extensionDays,
    fundingAsset,
    signTransaction,
}) {
    const op = getCrowdfundingContract().call(
        'create_campaign',
        addressToScVal(organizerAddress),
        stringToScVal(title),
        stringToScVal(description),
        i128ToScVal(goalAmount),
        u64ToScVal(deadline),
        u32ToScVal(extensionDays),
        unitEnumToScVal(fundingAsset),
    )

    const xdrBlob = await simulateAndPrepare(organizerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function donate({ donorAddress, campaignId, amount, signTransaction }) {
    const op = getCrowdfundingContract().call(
        'donate',
        addressToScVal(donorAddress),
        u32ToScVal(campaignId),
        i128ToScVal(amount),
    )

    const xdrBlob = await simulateAndPrepare(donorAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function withdraw({ organizerAddress, campaignId, signTransaction }) {
    const op = getCrowdfundingContract().call('withdraw', u32ToScVal(campaignId))
    const xdrBlob = await simulateAndPrepare(organizerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function extendDeadline({ organizerAddress, campaignId, signTransaction }) {
    const op = getCrowdfundingContract().call('extend_deadline', u32ToScVal(campaignId))
    const xdrBlob = await simulateAndPrepare(organizerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function markAsFailed({ organizerAddress, campaignId, signTransaction }) {
    const op = getCrowdfundingContract().call('mark_as_failed', u32ToScVal(campaignId))
    const xdrBlob = await simulateAndPrepare(organizerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function claimRefund({ donorAddress, campaignId, signTransaction }) {
    const op = getCrowdfundingContract().call(
        'claim_refund',
        addressToScVal(donorAddress),
        u32ToScVal(campaignId),
    )
    const xdrBlob = await simulateAndPrepare(donorAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function updateFeeSettings({
    ownerAddress,
    newFee,
    stakingShareBasisPoints,
    signTransaction,
}) {
    const op = getCrowdfundingContract().call(
        'update_fee_settings',
        u32ToScVal(newFee),
        u32ToScVal(stakingShareBasisPoints),
    )
    const xdrBlob = await simulateAndPrepare(ownerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function updateTreasuryWallet({ ownerAddress, newWallet, signTransaction }) {
    const op = getCrowdfundingContract().call('update_treasury_wallet', addressToScVal(newWallet))
    const xdrBlob = await simulateAndPrepare(ownerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function updateStakingContract({ ownerAddress, stakingContract, signTransaction }) {
    const op = getCrowdfundingContract().call('update_staking_contract', addressToScVal(stakingContract))
    const xdrBlob = await simulateAndPrepare(ownerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function getRegistryConfig() {
    requireContractId(REGISTRY_CONTRACT_ID, 'Registry')
    const config = await simulateRead(getRegistryContract(), 'get_config')
    return normalizeRegistryConfig(config)
}

export async function getStakingSettings() {
    requireContractId(STAKING_CONTRACT_ID, 'Staking')
    return simulateRead(getStakingContract(), 'get_settings')
}

export async function getTotalStaked() {
    requireContractId(STAKING_CONTRACT_ID, 'Staking')
    return simulateRead(getStakingContract(), 'get_total_staked')
}

export async function getStakingPosition(stakerAddress) {
    requireContractId(STAKING_CONTRACT_ID, 'Staking')
    const position = await simulateRead(getStakingContract(), 'get_position', addressToScVal(stakerAddress))
    return normalizePosition(position)
}

export async function getStakingPool(rewardAsset) {
    requireContractId(STAKING_CONTRACT_ID, 'Staking')
    const pool = await simulateRead(getStakingContract(), 'get_pool', unitEnumToScVal(rewardAsset))
    return normalizePool(pool)
}

export async function stakeArya({ stakerAddress, amount, lockupDays, signTransaction }) {
    requireContractId(STAKING_CONTRACT_ID, 'Staking')
    requireTokenId(ARYA_TOKEN_ID, 'ARYA')
    const op = getStakingContract().call(
        'stake',
        addressToScVal(stakerAddress),
        i128ToScVal(amount),
        u32ToScVal(lockupDays),
    )
    const xdrBlob = await simulateAndPrepare(stakerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function unstakeArya({ stakerAddress, amount, signTransaction }) {
    requireContractId(STAKING_CONTRACT_ID, 'Staking')
    const op = getStakingContract().call(
        'unstake',
        addressToScVal(stakerAddress),
        i128ToScVal(amount),
    )
    const xdrBlob = await simulateAndPrepare(stakerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function claimStakingRewards({ stakerAddress, signTransaction }) {
    requireContractId(STAKING_CONTRACT_ID, 'Staking')
    const op = getStakingContract().call('claim_rewards', addressToScVal(stakerAddress))
    const xdrBlob = await simulateAndPrepare(stakerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function getLaunchpadSettings() {
    requireContractId(LAUNCHPAD_CONTRACT_ID, 'Launchpad')
    const settings = await simulateRead(getLaunchpadContract(), 'get_platform_settings')
    return normalizeLaunchpadSettings(settings)
}

export async function getSaleCount() {
    requireContractId(LAUNCHPAD_CONTRACT_ID, 'Launchpad')
    return simulateRead(getLaunchpadContract(), 'get_sale_count')
}

export async function getSale(saleId) {
    requireContractId(LAUNCHPAD_CONTRACT_ID, 'Launchpad')
    const sale = await simulateRead(getLaunchpadContract(), 'get_sale', u32ToScVal(saleId))
    return normalizeSale(sale)
}

export async function getSales() {
    const count = await getSaleCount()
    const sales = []
    for (let i = 0; i < count; i++) {
        try {
            sales.push(await getSale(i))
        } catch {
            // Skip missing sale slots.
        }
    }
    return sales
}

export async function getContribution(saleId, buyerAddress) {
    requireContractId(LAUNCHPAD_CONTRACT_ID, 'Launchpad')
    return simulateRead(
        getLaunchpadContract(),
        'get_contribution',
        u32ToScVal(saleId),
        addressToScVal(buyerAddress),
    )
}

export async function createSale({
    ownerAddress,
    saleToken,
    tokenPrice,
    tokenSupply,
    softCap,
    hardCap,
    startTime,
    endTime,
    fundingAsset,
    signTransaction,
}) {
    requireContractId(LAUNCHPAD_CONTRACT_ID, 'Launchpad')
    const op = getLaunchpadContract().call(
        'create_sale',
        addressToScVal(ownerAddress),
        addressToScVal(saleToken),
        i128ToScVal(tokenPrice),
        i128ToScVal(tokenSupply),
        i128ToScVal(softCap),
        i128ToScVal(hardCap),
        u64ToScVal(startTime),
        u64ToScVal(endTime),
        unitEnumToScVal(fundingAsset),
    )
    const xdrBlob = await simulateAndPrepare(ownerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function contributeToSale({ buyerAddress, saleId, amount, signTransaction }) {
    requireContractId(LAUNCHPAD_CONTRACT_ID, 'Launchpad')
    const op = getLaunchpadContract().call(
        'contribute',
        addressToScVal(buyerAddress),
        u32ToScVal(saleId),
        i128ToScVal(amount),
    )
    const xdrBlob = await simulateAndPrepare(buyerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function withdrawSaleFunds({ ownerAddress, saleId, signTransaction }) {
    requireContractId(LAUNCHPAD_CONTRACT_ID, 'Launchpad')
    const op = getLaunchpadContract().call('withdraw_funds', u32ToScVal(saleId))
    const xdrBlob = await simulateAndPrepare(ownerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function claimLaunchpadTokens({ buyerAddress, saleId, signTransaction }) {
    requireContractId(LAUNCHPAD_CONTRACT_ID, 'Launchpad')
    const op = getLaunchpadContract().call(
        'claim_tokens',
        addressToScVal(buyerAddress),
        u32ToScVal(saleId),
    )
    const xdrBlob = await simulateAndPrepare(buyerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function claimLaunchpadRefund({ buyerAddress, saleId, signTransaction }) {
    requireContractId(LAUNCHPAD_CONTRACT_ID, 'Launchpad')
    const op = getLaunchpadContract().call(
        'claim_refund',
        addressToScVal(buyerAddress),
        u32ToScVal(saleId),
    )
    const xdrBlob = await simulateAndPrepare(buyerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}

export async function reclaimUnsoldTokens({ ownerAddress, saleId, signTransaction }) {
    requireContractId(LAUNCHPAD_CONTRACT_ID, 'Launchpad')
    const op = getLaunchpadContract().call('reclaim_unsold_tokens', u32ToScVal(saleId))
    const xdrBlob = await simulateAndPrepare(ownerAddress, op)
    const signedXdr = await signTransaction(xdrBlob)
    return submitSigned(signedXdr)
}
