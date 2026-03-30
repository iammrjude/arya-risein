export function toUnixTimestamp(dateString) {
    return Math.floor(new Date(dateString).getTime() / 1000)
}

export function fromUnixTimestamp(ts) {
    return new Date(Number(ts) * 1000)
}

export function formatDate(ts) {
    return fromUnixTimestamp(ts).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

export function isExpired(ts) {
    return Math.floor(Date.now() / 1000) > Number(ts)
}

export function getCountdown(deadlineTs) {
    const now = Math.floor(Date.now() / 1000)
    const diff = Number(deadlineTs) - now

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }

    const days = Math.floor(diff / 86400)
    const hours = Math.floor((diff % 86400) / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    const seconds = diff % 60

    return { days, hours, minutes, seconds, expired: false }
}

export function getActionWindowExpiry(deadlineTs, actionWindowDays) {
    return Number(deadlineTs) + Number(actionWindowDays) * 24 * 60 * 60
}
