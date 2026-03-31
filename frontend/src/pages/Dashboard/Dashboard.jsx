import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCampaigns, usePlatformSettings } from '../../hooks/useContract'
import { useWallet } from '../../hooks/useWallet'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import ProgressBar from '../../components/ProgressBar/ProgressBar'
import CountdownTimer from '../../components/CountdownTimer/CountdownTimer'
import TxStatus from '../../components/TxStatus/TxStatus'
import { withdraw, extendDeadline, markAsFailed } from '../../contract/client'
import { formatAmountForFundingAsset } from '../../utils/format'
import { isExpired, getActionWindowExpiry, getCountdown } from '../../utils/time'
import styles from './Dashboard.module.css'

export default function Dashboard() {
    const [address, setAddress] = useState(null)
    const { campaigns, loading, refresh } = useCampaigns()
    const { settings } = usePlatformSettings()
    const { getAddress, signTransaction } = useWallet()
    const [txStatus, setTxStatus] = useState({})
    const [txHash, setTxHash] = useState({})
    const [txError, setTxError] = useState({})

    useEffect(() => {
        async function getAddr() {
            const addr = await getAddress()
            setAddress(addr)
        }
        getAddr()
        const interval = setInterval(getAddr, 2000)
        return () => clearInterval(interval)
    }, [getAddress])

    const myCampaigns = campaigns.filter(c =>
        address && c.organizer === address
    )

    async function handleAction(campaignId, action) {
        if (!address) return
        setTxStatus(s => ({ ...s, [campaignId]: 'pending' }))
        setTxError(s => ({ ...s, [campaignId]: null }))

        try {
            let result
            if (action === 'withdraw') {
                result = await withdraw({ organizerAddress: address, campaignId, signTransaction })
            } else if (action === 'extend') {
                result = await extendDeadline({ organizerAddress: address, campaignId, signTransaction })
            } else if (action === 'fail') {
                result = await markAsFailed({ organizerAddress: address, campaignId, signTransaction })
            }
            setTxStatus(s => ({ ...s, [campaignId]: 'success' }))
            setTxHash(s => ({ ...s, [campaignId]: result.hash }))
            refresh()
        } catch (err) {
            setTxStatus(s => ({ ...s, [campaignId]: 'error' }))
            setTxError(s => ({ ...s, [campaignId]: err.message }))
        }
    }

    if (!address) {
        return (
            <div className={styles.page}>
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>◈</span>
                    <p>Connect your wallet to view your campaigns</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>My Campaigns</h1>
                    <Link to="/crowdfunding/create" className={styles.createBtn}>+ New Campaign</Link>
                </div>

                {loading && (
                    <div className={styles.loading}>
                        <span className={styles.spinner} /> Loading campaigns...
                    </div>
                )}

                {!loading && myCampaigns.length === 0 && (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>◈</span>
                        <p>You have not created any campaigns yet.</p>
                        <Link to="/crowdfunding/create" className={styles.createLink}>Create your first campaign →</Link>
                    </div>
                )}

                <div className={styles.list}>
                    {myCampaigns.map(campaign => {
                        const statusLabel = campaign.status
                        const raised = Number(campaign.total_raised)
                        const goal = Number(campaign.goal_amount)
                        const goalReached = raised >= goal
                        const countdown = getCountdown(campaign.deadline)
                        const displayStatus = (goalReached && statusLabel === 'Active')
                            ? 'Goal Met'
                            : statusLabel
                        const isActive = statusLabel === 'Active'
                        const deadlinePassed = isExpired(campaign.deadline)
                        const actionWindowExpiry = settings
                            ? getActionWindowExpiry(campaign.deadline, settings.action_window_days)
                            : null
                        const inActionWindow = actionWindowExpiry
                            ? !isExpired(actionWindowExpiry)
                            : false
                        const percent = goal > 0 ? (raised / goal) * 100 : 0
                        const canExtend = isActive && deadlinePassed && !campaign.extension_used && inActionWindow && percent >= 70
                        const canWithdraw = isActive && raised >= goal
                        const canMarkFailed = isActive && percent < 70 && deadlinePassed && inActionWindow

                        return (
                            <div key={campaign.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardTitleRow}>
                                        <Link to={`/crowdfunding/campaign/${campaign.id}`} className={styles.cardTitle}>
                                            {campaign.title}
                                        </Link>
                                        <StatusBadge status={displayStatus} />
                                    </div>
                                </div>

                                <div className={styles.cardBody}>
                                    <ProgressBar totalRaised={campaign.total_raised} goalAmount={campaign.goal_amount} />
                                    <div className={styles.cardMeta}>
                                        {goalReached && !countdown.expired ? (
                                            <div className={styles.goalMetMessage}>
                                                <span>{displayStatus}</span>
                                            </div>
                                        ) : (
                                            <CountdownTimer deadlineTs={campaign.deadline} label="Deadline" />
                                        )}
                                        <div className={styles.raised}>
                                            <span className={styles.raisedLabel}>Raised</span>
                                            <span className={styles.raisedValue}>{formatAmountForFundingAsset(campaign.total_raised, campaign.funding_asset)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    {canWithdraw && (
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => handleAction(campaign.id, 'withdraw')}
                                            disabled={txStatus[campaign.id] === 'pending'}
                                        >
                                            Withdraw Funds
                                        </button>
                                    )}
                                    {canExtend && (
                                        <button
                                            className={`${styles.actionBtn} ${styles.extendBtn}`}
                                            onClick={() => handleAction(campaign.id, 'extend')}
                                            disabled={txStatus[campaign.id] === 'pending'}
                                        >
                                            Extend Deadline
                                        </button>
                                    )}
                                    {canMarkFailed && (
                                        <button
                                            className={`${styles.actionBtn} ${styles.failBtn}`}
                                            onClick={() => handleAction(campaign.id, 'fail')}
                                            disabled={txStatus[campaign.id] === 'pending'}
                                        >
                                            Mark as Failed
                                        </button>
                                    )}
                                </div>

                                {txStatus[campaign.id] && (
                                    <div className={styles.txWrapper}>
                                        <TxStatus
                                            status={txStatus[campaign.id]}
                                            hash={txHash[campaign.id]}
                                            error={txError[campaign.id]}
                                            onClose={() => setTxStatus(s => ({ ...s, [campaign.id]: null }))}
                                        />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
