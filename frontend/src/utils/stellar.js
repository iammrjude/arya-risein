export function truncateAddress(addr, start = 6, end = 6) {
    if (!addr) return ''
    return `${addr.slice(0, start)}...${addr.slice(-end)}`
}

export function explorerUrl(hash) {
    return `https://stellar.expert/explorer/testnet/tx/${hash}`
}

export function contractUrl(id) {
    return `https://stellar.expert/explorer/testnet/contract/${id}`
}
