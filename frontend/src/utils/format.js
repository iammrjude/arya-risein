const STROOPS_PER_XLM = 10_000_000

export function xlmToStroops(xlm) {
    return BigInt(Math.round(parseFloat(xlm) * STROOPS_PER_XLM))
}

export function stroopsToXlm(stroops) {
    return (Number(stroops) / STROOPS_PER_XLM).toFixed(7)
}

export function formatXlm(stroops) {
    const xlm = Number(stroops) / STROOPS_PER_XLM
    return xlm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 7 })
}

export function basisPointsToPercent(bp) {
    return (bp / 100).toFixed(2)
}

export function calcFee(amountStroops, basisPoints) {
    return (BigInt(amountStroops) * BigInt(basisPoints)) / 10000n
}

export function calcSuggestedGoal(desiredAmountXlm, basisPoints) {
    const desired = parseFloat(desiredAmountXlm)
    if (isNaN(desired) || desired <= 0) return ''
    const feeAmount = desired * (basisPoints / 10000)
    const suggested = desired + feeAmount
    return suggested.toFixed(2)
}

export function normalizeContractEnum(value) {
    if (Array.isArray(value)) {
        return value[0] ?? ''
    }
    return value ?? ''
}

export function assetCodeFromFundingAsset(value) {
    const normalized = normalizeContractEnum(value)
    if (normalized === 'Usdc') return 'USDC'
    return 'XLM'
}

export function formatAmountForFundingAsset(amount, fundingAsset) {
    return `${stroopsToXlm(amount)} ${assetCodeFromFundingAsset(fundingAsset)}`
}
