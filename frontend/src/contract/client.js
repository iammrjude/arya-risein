import {
    Address,
    Asset,
    BASE_FEE,
    Contract,
    Horizon,
    LiquidityPoolAsset,
    Operation,
    TransactionBuilder,
    getLiquidityPoolId,
    nativeToScVal,
    rpc,
    scValToNative,
    xdr,
} from '@stellar/stellar-sdk'
import {
    ARYA_TOKEN_ID,
    CROWDFUNDING_CONTRACT_ID,
    HORIZON_URL,
    LAUNCHPAD_CONTRACT_ID,
    NETWORK_PASSPHRASE,
    PLATFORM_OWNER,
    READ_ACCOUNT,
    REGISTRY_CONTRACT_ID,
    STAKING_CONTRACT_ID,
} from './config'
import { rpcServer } from './server'
import { normalizeContractEnum } from '../utils/format'

const server = rpcServer
const horizonServer = new Horizon.Server(HORIZON_URL)
const ARYA_TOTAL_SUPPLY = 100_000_000
const TREASURY_STARTING_ARYA = 45_000_000
const INITIAL_LP_ARYA = 500_000
const INITIAL_LP_XLM = 5_000
const LIQUIDITY_POOL_FEE = 30

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

function requirePlatformOwner() {
    if (!PLATFORM_OWNER) {
        throw new Error('Platform owner address is not configured')
    }
}

function getAryaAsset() {
    requirePlatformOwner()
    return new Asset('ARYA', PLATFORM_OWNER)
}

function getAryaAssetDescriptor() {
    requirePlatformOwner()
    return `ARYA:${PLATFORM_OWNER}`
}

function getAryaXlmPoolAsset() {
    return new LiquidityPoolAsset(Asset.native(), getAryaAsset(), LIQUIDITY_POOL_FEE)
}

function getAryaXlmPoolId() {
    return getLiquidityPoolId('constant_product', getAryaXlmPoolAsset().getLiquidityPoolParameters()).toString('hex')
}

function normalizeAssetAmount(amount) {
    const trimmed = String(amount ?? '').trim()
    if (!trimmed) {
        throw new Error('Enter an ARYA amount')
    }

    if (!/^\d+(\.\d{1,7})?$/.test(trimmed)) {
        throw new Error('Use a valid ARYA amount with up to 7 decimals')
    }

    const [whole, fraction = ''] = trimmed.split('.')
    const normalized = `${whole}.${fraction.padEnd(7, '0')}`

    if (Number(normalized) <= 0) {
        throw new Error('Amount must be greater than zero')
    }

    return normalized
}

function describeHorizonError(err, fallback) {
    const resultCodes = err?.response?.data?.extras?.result_codes
    const operationCodes = resultCodes?.operations ?? []

    if (operationCodes.includes('op_no_trust')) {
        return 'Recipient has no ARYA trustline. Add the ARYA asset in the wallet before retrying.'
    }

    if (operationCodes.includes('op_no_destination')) {
        return 'Recipient wallet was not found on Stellar testnet.'
    }

    if (resultCodes?.transaction === 'tx_insufficient_balance' || operationCodes.includes('op_underfunded')) {
        return 'Insufficient balance to complete this transfer.'
    }

    if (operationCodes.includes('op_line_full')) {
        return 'The receiving trustline is full. Increase the trustline limit and retry.'
    }

    return fallback
}

async function buildAndSubmitHorizonTransaction(sourceAddress, operations, signTransaction) {
    const sourceAccount = await horizonServer.loadAccount(sourceAddress)
    const tx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })

    operations.forEach(operation => tx.addOperation(operation))
    const builtTx = tx.setTimeout(180).build()
    const signedXdr = await signTransaction(builtTx.toXDR())
    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)

    return horizonServer.submitTransaction(signedTx)
}

function getPoolReserveAmount(poolRecord, assetDescriptor) {
    const reserve = poolRecord?.reserves?.find(item => item.asset === assetDescriptor)
    return Number(reserve?.amount ?? 0)
}

function buildLiquidityPoolDepositConfig(aryaAmount, xlmAmount) {
    const normalizedArya = normalizeAssetAmount(aryaAmount)
    const normalizedXlm = normalizeAssetAmount(xlmAmount)
    const aryaAsset = getAryaAsset()
    const xlmAsset = Asset.native()

    let assetA = xlmAsset
    let assetB = aryaAsset
    let maxAmountA = normalizedXlm
    let maxAmountB = normalizedArya

    if (Asset.compare(aryaAsset, xlmAsset) < 0) {
        assetA = aryaAsset
        assetB = xlmAsset
        maxAmountA = normalizedArya
        maxAmountB = normalizedXlm
    }

    const price = Number(maxAmountA) / Number(maxAmountB)
    const minPrice = Math.max(price * 0.8, 0.0000001)
    const maxPrice = price * 1.2

    return {
        assetA,
        assetB,
        maxAmountA,
        maxAmountB,
        minPrice: minPrice.toFixed(7),
        maxPrice: maxPrice.toFixed(7),
    }
}

async function loadAccountRecord(address) {
    try {
        return await horizonServer.loadAccount(address)
    } catch (err) {
        if (err?.response?.status === 404) {
            return null
        }
        throw err
    }
}

async function fetchLiquidityPoolRecord(poolId) {
    const response = await fetch(`${HORIZON_URL}/liquidity_pools/${poolId}`)
    if (response.status === 404) {
        return null
    }
    if (!response.ok) {
        throw new Error('Unable to load ARYA/XLM liquidity pool state right now.')
    }
    return response.json()
}

function parseHorizonAsset(asset) {
    if (!asset || asset.asset_type === 'native') {
        return Asset.native()
    }

    return new Asset(asset.asset_code, asset.asset_issuer)
}

function applySlippageFloor(amount, slippageBps) {
    const numericAmount = Number(amount)
    const safeAmount = numericAmount * (1 - (slippageBps / 10_000))
    return Math.max(safeAmount, 0.0000001).toFixed(7)
}

async function fetchStrictSendPath(direction, sourceAmount) {
    const params = new URLSearchParams()
    params.set('source_amount', sourceAmount)

    if (direction === 'buy') {
        params.set('source_asset_type', 'native')
        params.set('destination_assets', getAryaAssetDescriptor())
    } else {
        params.set('source_asset_type', 'credit_alphanum4')
        params.set('source_asset_code', 'ARYA')
        params.set('source_asset_issuer', PLATFORM_OWNER)
        params.set('destination_assets', 'native')
    }

    const response = await fetch(`${HORIZON_URL}/paths/strict-send?${params.toString()}`)
    if (!response.ok) {
        throw new Error('Unable to fetch a swap route right now.')
    }

    const data = await response.json()
    return data?._embedded?.records?.[0] ?? null
}

export async function getAryaXlmPoolStatus() {
    const poolId = getAryaXlmPoolId()
    const poolRecord = await fetchLiquidityPoolRecord(poolId)

    return {
        poolId,
        poolExists: Boolean(poolRecord),
        totalShares: Number(poolRecord?.total_shares ?? 0),
        xlmReserve: getPoolReserveAmount(poolRecord, 'native'),
        aryaReserve: getPoolReserveAmount(poolRecord, `ARYA:${PLATFORM_OWNER}`),
    }
}

export async function getAryaSwapQuote({ direction, amount }) {
    requirePlatformOwner()
    const normalizedAmount = normalizeAssetAmount(amount)
    const route = await fetchStrictSendPath(direction, normalizedAmount)

    if (!route) {
        return null
    }

    return {
        direction,
        sendAmount: route.source_amount ?? normalizedAmount,
        destinationAmount: route.destination_amount,
        sourceAssetLabel: direction === 'buy' ? 'XLM' : 'ARYA',
        destinationAssetLabel: direction === 'buy' ? 'ARYA' : 'XLM',
        path: route.path ?? [],
    }
}

export async function swapAryaAgainstXlm({
    walletAddress,
    direction,
    amount,
    signTransaction,
    slippageBps = 100,
}) {
    requirePlatformOwner()

    const normalizedAmount = normalizeAssetAmount(amount)
    const quote = await getAryaSwapQuote({ direction, amount: normalizedAmount })

    if (!quote) {
        throw new Error(`No ${direction === 'buy' ? 'XLM to ARYA' : 'ARYA to XLM'} swap route is available right now.`)
    }

    if (direction === 'buy') {
        const trustlineStatus = await getAssetTrustlineStatus(walletAddress)
        if (!trustlineStatus.accountExists) {
            throw new Error('Wallet was not found on Stellar testnet.')
        }
        if (!trustlineStatus.hasTrustline) {
            throw new Error('Add the ARYA trustline before swapping XLM into ARYA.')
        }
    }

    const sourceAccount = await horizonServer.loadAccount(walletAddress)
    const tx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(Operation.pathPaymentStrictSend({
            sendAsset: direction === 'buy' ? Asset.native() : getAryaAsset(),
            sendAmount: normalizedAmount,
            destination: walletAddress,
            destAsset: direction === 'buy' ? getAryaAsset() : Asset.native(),
            destMin: applySlippageFloor(quote.destinationAmount, slippageBps),
            path: quote.path.map(parseHorizonAsset),
        }))
        .setTimeout(180)
        .build()

    const signedXdr = await signTransaction(tx.toXDR())
    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)

    try {
        const result = await horizonServer.submitTransaction(signedTx)
        return { success: true, hash: result.hash, result, quote }
    } catch (err) {
        throw new Error(describeHorizonError(err, 'Swap failed. Check the route, trustline, and balances, then retry.'))
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

export async function getAssetTrustlineStatus(walletAddress) {
    requirePlatformOwner()
    const aryaAsset = getAryaAsset()

    try {
        const account = await horizonServer.loadAccount(walletAddress)
        const trustline = account.balances.find(balance =>
            balance.asset_code === aryaAsset.code && balance.asset_issuer === aryaAsset.issuer,
        )

        return {
            accountExists: true,
            hasTrustline: Boolean(trustline),
            balance: trustline?.balance ?? null,
            limit: trustline?.limit ?? null,
        }
    } catch (err) {
        if (err?.response?.status === 404) {
            return {
                accountExists: false,
                hasTrustline: false,
                balance: null,
                limit: null,
            }
        }

        throw new Error(describeHorizonError(err, 'Unable to verify ARYA trustline status right now.'))
    }
}

export async function fundTreasuryWithArya({
    issuerAddress,
    treasuryAddress,
    amount,
    signTransaction,
}) {
    requirePlatformOwner()

    if (issuerAddress !== PLATFORM_OWNER) {
        throw new Error('Connect the issuer wallet to fund the treasury with ARYA.')
    }

    if (!treasuryAddress) {
        throw new Error('Treasury wallet is not configured')
    }

    const trustlineStatus = await getAssetTrustlineStatus(treasuryAddress)
    if (!trustlineStatus.accountExists) {
        throw new Error('Treasury wallet does not exist on Stellar testnet yet.')
    }
    if (!trustlineStatus.hasTrustline) {
        throw new Error('Treasury wallet has no ARYA trustline. Add ARYA to the wallet before funding it.')
    }

    const issuerAccount = await horizonServer.loadAccount(issuerAddress)
    const tx = new TransactionBuilder(issuerAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(Operation.payment({
            destination: treasuryAddress,
            asset: getAryaAsset(),
            amount: normalizeAssetAmount(amount),
        }))
        .setTimeout(180)
        .build()

    const signedXdr = await signTransaction(tx.toXDR())
    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)

    try {
        const result = await horizonServer.submitTransaction(signedTx)
        return { success: true, hash: result.hash, result }
    } catch (err) {
        throw new Error(describeHorizonError(err, 'ARYA transfer failed. Check the trustline, issuer wallet, and network status.'))
    }
}

export async function getAryaLiquiditySnapshot(treasuryAddress) {
    requirePlatformOwner()

    const poolId = getAryaXlmPoolId()
    const account = await loadAccountRecord(treasuryAddress)
    const poolRecord = await fetchLiquidityPoolRecord(poolId)

    if (!account) {
        return {
            poolId,
            accountExists: false,
            hasAryaTrustline: false,
            hasPoolShareTrustline: false,
            treasuryXlmBalance: null,
            treasuryAryaBalance: null,
            treasuryPoolShareBalance: null,
            poolExists: Boolean(poolRecord),
            poolRecord,
            positionSharePercent: 0,
            withdrawableXlm: 0,
            withdrawableArya: 0,
            estimatedPositionChangeXlm: 0,
            estimatedPositionChangeArya: 0,
            initialLiquidityXlm: INITIAL_LP_XLM,
            initialLiquidityArya: INITIAL_LP_ARYA,
            totalSupply: ARYA_TOTAL_SUPPLY,
            treasuryStartingArya: TREASURY_STARTING_ARYA,
        }
    }

    const xlmBalance = account.balances.find(balance => balance.asset_type === 'native')
    const aryaBalance = account.balances.find(balance =>
        balance.asset_code === 'ARYA' && balance.asset_issuer === PLATFORM_OWNER,
    )
    const poolShareBalance = account.balances.find(balance =>
        balance.asset_type === 'liquidity_pool_shares' && balance.liquidity_pool_id === poolId,
    )

    const totalShares = Number(poolRecord?.total_shares ?? 0)
    const treasuryShares = Number(poolShareBalance?.balance ?? 0)
    const shareRatio = totalShares > 0 ? treasuryShares / totalShares : 0
    const poolXlmReserve = getPoolReserveAmount(poolRecord, 'native')
    const poolAryaReserve = getPoolReserveAmount(poolRecord, `ARYA:${PLATFORM_OWNER}`)
    const withdrawableXlm = poolXlmReserve * shareRatio
    const withdrawableArya = poolAryaReserve * shareRatio

    return {
        poolId,
        accountExists: true,
        hasAryaTrustline: Boolean(aryaBalance),
        hasPoolShareTrustline: Boolean(poolShareBalance),
        treasuryXlmBalance: xlmBalance?.balance ?? null,
        treasuryAryaBalance: aryaBalance?.balance ?? null,
        treasuryPoolShareBalance: poolShareBalance?.balance ?? null,
        poolExists: Boolean(poolRecord),
        poolRecord,
        positionSharePercent: shareRatio * 100,
        withdrawableXlm,
        withdrawableArya,
        estimatedPositionChangeXlm: withdrawableXlm - INITIAL_LP_XLM,
        estimatedPositionChangeArya: withdrawableArya - INITIAL_LP_ARYA,
        initialLiquidityXlm: INITIAL_LP_XLM,
        initialLiquidityArya: INITIAL_LP_ARYA,
        totalSupply: ARYA_TOTAL_SUPPLY,
        treasuryStartingArya: TREASURY_STARTING_ARYA,
    }
}

export async function addAryaXlmLiquidity({
    treasuryAddress,
    aryaAmount,
    xlmAmount,
    signTransaction,
}) {
    requirePlatformOwner()

    const account = await loadAccountRecord(treasuryAddress)
    if (!account) {
        throw new Error('Treasury wallet does not exist on Stellar testnet yet.')
    }

    const snapshot = await getAryaLiquiditySnapshot(treasuryAddress)
    if (!snapshot.hasAryaTrustline) {
        throw new Error('Treasury wallet must trust ARYA before it can provide liquidity.')
    }

    const poolId = getAryaXlmPoolId()
    const poolShareAsset = getAryaXlmPoolAsset()
    const depositConfig = buildLiquidityPoolDepositConfig(aryaAmount, xlmAmount)
    const operations = []

    if (!snapshot.hasPoolShareTrustline) {
        operations.push(Operation.changeTrust({ asset: poolShareAsset }))
    }

    operations.push(Operation.liquidityPoolDeposit({
        liquidityPoolId: poolId,
        maxAmountA: depositConfig.maxAmountA,
        maxAmountB: depositConfig.maxAmountB,
        minPrice: depositConfig.minPrice,
        maxPrice: depositConfig.maxPrice,
    }))

    try {
        const result = await buildAndSubmitHorizonTransaction(treasuryAddress, operations, signTransaction)
        return { success: true, hash: result.hash, result }
    } catch (err) {
        throw new Error(describeHorizonError(err, 'Liquidity deposit failed. Check treasury balances, trustlines, and price bounds.'))
    }
}

export async function removeAryaXlmLiquidity({
    treasuryAddress,
    poolSharesAmount,
    signTransaction,
}) {
    requirePlatformOwner()

    const snapshot = await getAryaLiquiditySnapshot(treasuryAddress)
    if (!snapshot.treasuryPoolShareBalance || Number(snapshot.treasuryPoolShareBalance) <= 0) {
        throw new Error('Treasury wallet does not currently hold ARYA/XLM pool shares.')
    }

    const normalizedShares = normalizeAssetAmount(poolSharesAmount)

    try {
        const result = await buildAndSubmitHorizonTransaction(treasuryAddress, [
            Operation.liquidityPoolWithdraw({
                liquidityPoolId: snapshot.poolId,
                amount: normalizedShares,
                minAmountA: '0.0000000',
                minAmountB: '0.0000000',
            }),
        ], signTransaction)

        return { success: true, hash: result.hash, result }
    } catch (err) {
        throw new Error(describeHorizonError(err, 'Liquidity withdrawal failed. Check the treasury pool-share balance and retry.'))
    }
}
