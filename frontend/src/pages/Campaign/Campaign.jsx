import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCampaign } from '../../hooks/useContract'
import { useWallet } from '../../hooks/useWallet'
import ProgressBar from '../../components/ProgressBar/ProgressBar'
import CountdownTimer from '../../components/CountdownTimer/CountdownTimer'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import TxStatus from '../../components/TxStatus/TxStatus'
import { donate, claimRefund } from '../../contract/client'
import { xlmToStroops, formatAmountForFundingAsset, assetCodeFromFundingAsset } from '../../utils/format'
import { truncateAddress } from '../../utils/stellar'
import { formatDate, getCountdown } from '../../utils/time'
import styles from './Campaign.module.css'

export default function Campaign() {
    const { id } = useParams()
    const { campaign, loading, error, refresh } = useCampaign(Number(id))
    const { getAddress, signTransaction } = useWallet()

    const [donateAmount, setDonateAmount] = useState('')
    const [txStatus, setTxStatus] = useState(null)
    const [txHash, setTxHash] = useState(null)
    const [txError, setTxError] = useState(null)

    async function handleDonate() {
        const address = await getAddress()
        if (!address) {
            setTxError('Please connect your wallet first')
            setTxStatus('error')
            return
        }

        const amountXlm = parseFloat(donateAmount)
        if (isNaN(amountXlm) || amountXlm <= 0) {
            setTxError('Please enter a valid amount')
            setTxStatus('error')
            return
        }

        setTxStatus('pending')
        setTxHash(null)
        setTxError(null)

        try {
            const result = await donate({
                donorAddress: address,
                campaignId: Number(id),
                amount: xlmToStroops(amountXlm),
                signTransaction,
            })
            setTxStatus('success')
            setTxHash(result.hash)
            setDonateAmount('')
            refresh()
        } catch (err) {
            setTxStatus('error')
            if (err.message?.includes('balance') || err.message?.includes('underfunded')) {
                setTxError('Insufficient XLM balance')
            } else if (err.message?.includes('rejected') || err.message?.includes('denied')) {
                setTxError('Transaction rejected')
            } else {
                setTxError(err.message || 'Transaction failed')
            }
        }
    }

    async function handleClaimRefund() {
        const address = await getAddress()
        if (!address) {
            setTxError('Please connect your wallet first')
            setTxStatus('error')
            return
        }

        setTxStatus('pending')
        setTxHash(null)
        setTxError(null)

        try {
            const result = await claimRefund({
                donorAddress: address,
                campaignId: Number(id),
                signTransaction,
            })
            setTxStatus('success')
            setTxHash(result.hash)
            refresh()
        } catch (err) {
            setTxStatus('error')
            setTxError(err.message || 'Refund failed')
        }
    }

    if (loading) return (
        <div className={styles.page}>
            <div className={styles.skeleton} />
        </div>
    )

    if (error || !campaign) return (
        <div className={styles.page}>
            <div className={styles.errorBox}>Campaign not found: {error}</div>
        </div>
    )

    const statusLabel = campaign.status
    const goalReached = Number(campaign.total_raised) >= Number(campaign.goal_amount)
    const countdown = getCountdown(campaign.deadline)
    const assetCode = assetCodeFromFundingAsset(campaign.funding_asset)
    const displayStatus = (goalReached && statusLabel === 'Active')
        ? 'Goal Met'
        : statusLabel
    const isActive = statusLabel === 'Active'
    const isSuccessful = statusLabel === 'Successful'
    const isFailed = statusLabel === 'Failed'

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.titleRow}>
                        <h1 className={styles.title}>{campaign.title}</h1>
                        <StatusBadge status={displayStatus} />
                    </div>
                    <p className={styles.organizer}>
                        by <span className={styles.address}>{truncateAddress(campaign.organizer, 8, 8)}</span>
                    </p>
                </div>

                <div className={styles.grid}>
                    <div className={styles.left}>
                        <div className={styles.card}>
                            <h2 className={styles.sectionTitle}>About this campaign</h2>
                            <p className={styles.description}>{campaign.description}</p>
                        </div>

                        <div className={styles.card}>
                            <h2 className={styles.sectionTitle}>Campaign Details</h2>
                            <div className={styles.details}>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Goal</span>
                                    <span className={styles.detailValue}>{formatAmountForFundingAsset(campaign.goal_amount, campaign.funding_asset)}</span>
                                </div>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Raised</span>
                                    <span className={styles.detailValue}>{formatAmountForFundingAsset(campaign.total_raised, campaign.funding_asset)}</span>
                                </div>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Deadline</span>
                                    <span className={styles.detailValue}>{formatDate(campaign.deadline)}</span>
                                </div>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Funding Asset</span>
                                    <span className={styles.detailValue}>{assetCode}</span>
                                </div>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Extension Days</span>
                                    <span className={styles.detailValue}>{campaign.extension_days} days</span>
                                </div>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Extension Used</span>
                                    <span className={styles.detailValue}>{campaign.extension_used ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.right}>
                        <div className={styles.card}>
                            <ProgressBar
                                totalRaised={campaign.total_raised}
                                goalAmount={campaign.goal_amount}
                            />
                            <div className={styles.timerWrapper}>
                                {goalReached && !countdown.expired ? (
                                    <div className={styles.goalMetMessage}>
                                        <span>{displayStatus}</span>
                                    </div>
                                ) : (
                                    <CountdownTimer deadlineTs={campaign.deadline} label="Time Remaining" />
                                )}
                            </div>
                        </div>

                        {isActive && !goalReached && (
                            <div className={styles.card}>
                                <h2 className={styles.sectionTitle}>Donate {assetCode}</h2>
                                <div className={styles.donateForm}>
                                    <div className={styles.inputWrap}>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            placeholder="0.0000000"
                                            value={donateAmount}
                                            onChange={e => setDonateAmount(e.target.value)}
                                            min="0"
                                            step="any"
                                            disabled={txStatus === 'pending'}
                                        />
                                        <span className={styles.inputSuffix}>{assetCode}</span>
                                    </div>
                                    <button
                                        className={styles.donateBtn}
                                        onClick={handleDonate}
                                        disabled={txStatus === 'pending' || !donateAmount}
                                    >
                                        {txStatus === 'pending' ? (
                                            <><span className={styles.spinner} /> Donating...</>
                                        ) : (
                                            'Donate →'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {isActive && goalReached && (
                            <div className={styles.card}>
                                <h2 className={styles.sectionTitle}>Goal Reached! 🎉</h2>
                                <p className={styles.refundNote}>
                                    This campaign has reached its goal. The organizer can now withdraw funds from their dashboard.
                                </p>
                            </div>
                        )}

                        {isFailed && (
                            <div className={styles.card}>
                                <h2 className={styles.sectionTitle}>Campaign Failed</h2>
                                <p className={styles.refundNote}>
                                    This campaign did not reach its goal. If you donated, you can claim your full refund below.
                                </p>
                                <button
                                    className={styles.refundBtn}
                                    onClick={handleClaimRefund}
                                    disabled={txStatus === 'pending'}
                                >
                                    {txStatus === 'pending' ? (
                                        <><span className={styles.spinner} /> Processing...</>
                                    ) : (
                                        'Claim Refund →'
                                    )}
                                </button>
                            </div>
                        )}

                        {isSuccessful && (
                            <div className={styles.card}>
                                <h2 className={styles.sectionTitle}>Campaign Successful</h2>
                                <p className={styles.refundNote}>
                                    This campaign reached its goal and funds have been withdrawn by the organizer.
                                </p>
                            </div>
                        )}

                        {txStatus && (
                            <TxStatus
                                status={txStatus}
                                hash={txHash}
                                error={txError}
                                onClose={() => { setTxStatus(null); setTxError(null) }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
