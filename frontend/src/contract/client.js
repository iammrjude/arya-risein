import {
    Contract,
    TransactionBuilder,
    BASE_FEE,
    nativeToScVal,
    Address,
    scValToNative,
    rpc,
} from '@stellar/stellar-sdk'
import { CONTRACT_ID, NETWORK_PASSPHRASE, RPC_URL, READ_ACCOUNT } from './config'

const server = new rpc.Server(RPC_URL)
const contract = new Contract(CONTRACT_ID)

// ===== HELPERS =====

function addressToScVal(address) {
    return nativeToScVal(Address.fromString(address), { type: 'address' })
}

function u32ToScVal(value) {
    return nativeToScVal(value, { type: 'u32' })
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

async function submitSigned(signedXdr) {
    const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
    const result = await server.sendTransaction(tx)

    if (result.status === 'ERROR') {
        throw new Error(`Transaction failed: ${JSON.stringify(result.errorResult)}`)
    }

    // Poll for confirmation
    let attempts = 0
    while (attempts < 30) {
        await new Promise(r => setTimeout(r, 2000))
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

// ===== READ FUNCTIONS =====

export async function getCampaignCount() {
    const account = await server.getAccount(
        READ_ACCOUNT // neutral read account
    )
    const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(contract.call('get_campaign_count'))
        .setTimeout(30)
        .build()

    const result = await server.simulateTransaction(tx)
    if (result.error) throw new Error(result.error)
    return scValToNative(result.result.retval)
}

export async function getCampaign(campaignId) {
    const account = await server.getAccount(READ_ACCOUNT)
    const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(contract.call('get_campaign', u32ToScVal(campaignId)))
        .setTimeout(30)
        .build()

    const result = await server.simulateTransaction(tx)
    if (result.error) throw new Error(result.error)
    return scValToNative(result.result.retval)
}

export async function getCampaigns() {
    const count = await getCampaignCount()
    const campaigns = []
    for (let i = 0; i < count; i++) {
        try {
            const campaign = await getCampaign(i)
            campaigns.push(campaign)
        } catch {
            // skip missing campaigns
        }
    }
    return campaigns
}

export async function getDonorAmount(campaignId, donorAddress) {
    const account = await server.getAccount(READ_ACCOUNT)
    const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(contract.call(
            'get_donor_amount',
            u32ToScVal(campaignId),
            addressToScVal(donorAddress)
        ))
        .setTimeout(30)
        .build()

    const result = await server.simulateTransaction(tx)
    if (result.error) throw new Error(result.error)
    return scValToNative(result.result.retval)
}

export async function isCampaignFailed(campaignId) {
    const account = await server.getAccount(READ_ACCOUNT)
    const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(contract.call('is_campaign_failed', u32ToScVal(campaignId)))
        .setTimeout(30)
        .build()

    const result = await server.simulateTransaction(tx)
    if (result.error) throw new Error(result.error)
    return scValToNative(result.result.retval)
}

export async function isRefundClaimed(campaignId, donorAddress) {
    const account = await server.getAccount(READ_ACCOUNT)
    const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(contract.call(
            'is_refund_claimed',
            u32ToScVal(campaignId),
            addressToScVal(donorAddress)
        ))
        .setTimeout(30)
        .build()

    const result = await server.simulateTransaction(tx)
    if (result.error) throw new Error(result.error)
    return scValToNative(result.result.retval)
}

export async function getPlatformSettings() {
    const account = await server.getAccount(READ_ACCOUNT)
    const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
    })
        .addOperation(contract.call('get_platform_settings'))
        .setTimeout(30)
        .build()

    const result = await server.simulateTransaction(tx)
    if (result.error) throw new Error(result.error)
    return scValToNative(result.result.retval)
}

// ===== WRITE FUNCTIONS =====

export async function createCampaign({
    organizerAddress,
    title,
    description,
    goalAmount,
    deadline,
    extensionDays,
    signTransaction,
}) {
    const op = contract.call(
        'create_campaign',
        addressToScVal(organizerAddress),
        stringToScVal(title),
        stringToScVal(description),
        i128ToScVal(goalAmount),
        u64ToScVal(deadline),
        u32ToScVal(extensionDays),
    )

    const xdr = await simulateAndPrepare(organizerAddress, op)
    const signedXdr = await signTransaction(xdr)   // pass XDR string
    return submitSigned(signedXdr)
}

export async function donate({
    donorAddress,
    campaignId,
    amount,
    signTransaction,
}) {
    const op = contract.call(
        'donate',
        addressToScVal(donorAddress),
        u32ToScVal(campaignId),
        i128ToScVal(amount),
    )

    const xdr = await simulateAndPrepare(donorAddress, op)
    const signedXdr = await signTransaction(xdr)
    return submitSigned(signedXdr)
}

export async function withdraw({ organizerAddress, campaignId, signTransaction }) {
    const op = contract.call('withdraw', u32ToScVal(campaignId))
    const xdr = await simulateAndPrepare(organizerAddress, op)
    const signedXdr = await signTransaction(xdr)
    return submitSigned(signedXdr)
}

export async function extendDeadline({ organizerAddress, campaignId, signTransaction }) {
    const op = contract.call('extend_deadline', u32ToScVal(campaignId))
    const xdr = await simulateAndPrepare(organizerAddress, op)
    const signedXdr = await signTransaction(xdr)
    return submitSigned(signedXdr)
}

export async function markAsFailed({ organizerAddress, campaignId, signTransaction }) {
    const op = contract.call('mark_as_failed', u32ToScVal(campaignId))
    const xdr = await simulateAndPrepare(organizerAddress, op)
    const signedXdr = await signTransaction(xdr)
    return submitSigned(signedXdr)
}

export async function claimRefund({ donorAddress, campaignId, signTransaction }) {
    const op = contract.call(
        'claim_refund',
        addressToScVal(donorAddress),
        u32ToScVal(campaignId),
    )
    const xdr = await simulateAndPrepare(donorAddress, op)
    const signedXdr = await signTransaction(xdr)
    return submitSigned(signedXdr)
}

export async function updateFeePercent({ ownerAddress, newFee, signTransaction }) {
    const op = contract.call('update_fee_percent', u32ToScVal(newFee))
    const xdr = await simulateAndPrepare(ownerAddress, op)
    const signedXdr = await signTransaction(xdr)
    return submitSigned(signedXdr)
}

export async function updateTreasuryWallet({ ownerAddress, newWallet, signTransaction }) {
    const op = contract.call('update_treasury_wallet', addressToScVal(newWallet))
    const xdr = await simulateAndPrepare(ownerAddress, op)
    const signedXdr = await signTransaction(xdr)
    return submitSigned(signedXdr)
}

export async function updateActionWindow({ ownerAddress, newDays, signTransaction }) {
    const op = contract.call('update_action_window', u32ToScVal(newDays))
    const xdr = await simulateAndPrepare(ownerAddress, op)
    const signedXdr = await signTransaction(xdr)
    return submitSigned(signedXdr)
}

export async function transferOwnership({ ownerAddress, newOwner, signTransaction }) {
    const op = contract.call('transfer_ownership', addressToScVal(newOwner))
    const xdr = await simulateAndPrepare(ownerAddress, op)
    const signedXdr = await signTransaction(xdr)
    return submitSigned(signedXdr)
}
