import { useState, useEffect } from 'react'
import { usePlatformSettings, useCampaigns } from '../../hooks/useContract'
import { useWallet } from '../../hooks/useWallet'
import { updateFeePercent, updateTreasuryWallet, updateActionWindow, transferOwnership } from '../../contract/client'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import TxStatus from '../../components/TxStatus/TxStatus'
import { basisPointsToPercent, stroopsToXlm } from '../../utils/format'
import { truncateAddress } from '../../utils/stellar'
import { PLATFORM_OWNER } from '../../contract/config'
import styles from './Admin.module.css'

export default function Admin() {
    const [address, setAddress] = useState(null)
    const { settings, loading: settingsLoading } = usePlatformSettings()
    const { campaigns, loading: campaignsLoading } = useCampaigns()
    const { getAddress, signTransaction } = useWallet()
    const [filter, setFilter] = useState('All')

    const [feeInput, setFeeInput] = useState('')
    const [treasuryInput, setTreasuryInput] = useState('')
    const [actionWindowInput, setActionWindowInput] = useState('')
    const [newOwnerInput, setNewOwnerInput] = useState('')

    const [txStatus, setTxStatus] = useState(null)
    const [txHash, setTxHash] = useState(null)
    const [txError, setTxError] = useState(null)
    useEffect(() => {
        async function getAddr() {
            const addr = await getAddress()
            setAddress(addr)
        }
        getAddr()
        const interval = setInterval(getAddr, 2000)
        return () => clearInterval(interval)
    }, [getAddress])

    const isOwner = address && address === PLATFORM_OWNER

    async function handleAdminAction(label, action) {
        setTxStatus('pending')
        setTxHash(null)
        setTxError(null)
        try {
            const result = await action()
            setTxStatus('success')
            setTxHash(result.hash)
        } catch (err) {
            setTxStatus('error')
            setTxError(err.message)
        }
    }

    const filteredCampaigns = campaigns.filter(c => {
        if (filter === 'All') return true
        const status = c.status[0]
        return status.toLowerCase() === filter.toLowerCase()
    })

    if (!address) {
        return (
            <div className={styles.page}>
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>◈</span>
                    <p>Connect your wallet to access the admin panel</p>
                </div>
            </div>
        )
    }

    if (!isOwner) {
        return (
            <div className={styles.page}>
                <div className={styles.denied}>
                    <span className={styles.deniedIcon}>✕</span>
                    <h2 className={styles.deniedTitle}>Access Denied</h2>
                    <p className={styles.deniedText}>
                        This page is restricted to the platform owner.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Admin Panel</h1>
                    <div className={styles.ownerBadge}>
                        <div className={styles.ownerDot} />
                        <span className={styles.ownerAddress}>{truncateAddress(address)}</span>
                    </div>
                </div>

                {/* Platform Settings */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Platform Settings</h2>

                    {settingsLoading ? (
                        <div className={styles.skeleton} />
                    ) : settings && (
                        <div className={styles.settingsGrid}>
                            <div className={styles.settingCard}>
                                <span className={styles.settingLabel}>Current Fee</span>
                                <span className={styles.settingValue}>{basisPointsToPercent(settings.fee_basis_points)}%</span>
                            </div>
                            <div className={styles.settingCard}>
                                <span className={styles.settingLabel}>Treasury Wallet</span>
                                <span className={styles.settingValue}>{truncateAddress(settings.treasury_wallet, 8, 8)}</span>
                            </div>
                            <div className={styles.settingCard}>
                                <span className={styles.settingLabel}>Action Window</span>
                                <span className={styles.settingValue}>{settings.action_window_days} days</span>
                            </div>
                        </div>
                    )}

                    <div className={styles.formGrid}>
                        <div className={styles.formRow}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Update Fee (basis points)</label>
                                <input
                                    className={styles.input}
                                    type="number"
                                    placeholder="e.g. 250 = 2.5%"
                                    value={feeInput}
                                    onChange={e => setFeeInput(e.target.value)}
                                />
                            </div>
                            <button
                                className={styles.actionBtn}
                                onClick={() => handleAdminAction('Update Fee', () =>
                                    updateFeePercent({ ownerAddress: address, newFee: parseInt(feeInput), signTransaction })
                                )}
                                disabled={!feeInput || txStatus === 'pending'}
                            >
                                Update Fee
                            </button>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Update Treasury Wallet</label>
                                <input
                                    className={styles.input}
                                    type="text"
                                    placeholder="G..."
                                    value={treasuryInput}
                                    onChange={e => setTreasuryInput(e.target.value)}
                                />
                            </div>
                            <button
                                className={styles.actionBtn}
                                onClick={() => handleAdminAction('Update Treasury', () =>
                                    updateTreasuryWallet({ ownerAddress: address, newWallet: treasuryInput.trim(), signTransaction })
                                )}
                                disabled={!treasuryInput || txStatus === 'pending'}
                            >
                                Update Treasury
                            </button>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Update Action Window (days)</label>
                                <input
                                    className={styles.input}
                                    type="number"
                                    placeholder="e.g. 7"
                                    value={actionWindowInput}
                                    onChange={e => setActionWindowInput(e.target.value)}
                                />
                            </div>
                            <button
                                className={styles.actionBtn}
                                onClick={() => handleAdminAction('Update Action Window', () =>
                                    updateActionWindow({ ownerAddress: address, newDays: parseInt(actionWindowInput), signTransaction })
                                )}
                                disabled={!actionWindowInput || txStatus === 'pending'}
                            >
                                Update Window
                            </button>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Transfer Ownership</label>
                                <input
                                    className={styles.input}
                                    type="text"
                                    placeholder="New owner address G..."
                                    value={newOwnerInput}
                                    onChange={e => setNewOwnerInput(e.target.value)}
                                />
                            </div>
                            <button
                                className={`${styles.actionBtn} ${styles.dangerBtn}`}
                                onClick={() => handleAdminAction('Transfer Ownership', () =>
                                    transferOwnership({ ownerAddress: address, newOwner: newOwnerInput.trim(), signTransaction })
                                )}
                                disabled={!newOwnerInput || txStatus === 'pending'}
                            >
                                Transfer
                            </button>
                        </div>
                    </div>

                    {txStatus && (
                        <div className={styles.txWrapper}>
                            <TxStatus
                                status={txStatus}
                                hash={txHash}
                                error={txError}
                                onClose={() => { setTxStatus(null); setTxError(null) }}
                            />
                        </div>
                    )}
                </section>

                {/* All Campaigns */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>All Campaigns</h2>
                        <div className={styles.filters}>
                            {['All', 'Active', 'Successful', 'Failed'].map(f => (
                                <button
                                    key={f}
                                    className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {campaignsLoading ? (
                        <div className={styles.skeleton} />
                    ) : filteredCampaigns.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No {filter !== 'All' ? filter.toLowerCase() : ''} campaigns found.</p>
                        </div>
                    ) : (
                        <div className={styles.campaignList}>
                            {filteredCampaigns.map(c => {
                                const statusLabel = c.status[0]
                                const displayStatus = (Number(c.total_raised) >= Number(c.goal_amount) && statusLabel === 'Active')
                                    ? 'Goal Met'
                                    : statusLabel
                                return (
                                    <div key={c.id} className={styles.campaignRow}>
                                        <div className={styles.campaignInfo}>
                                            <span className={styles.campaignId}>#{c.id}</span>
                                            <span className={styles.campaignTitle}>{c.title}</span>
                                        </div>
                                        <div className={styles.campaignMeta}>
                                            <span className={styles.campaignOrganizer}>{truncateAddress(c.organizer)}</span>
                                            <span className={styles.campaignRaised}>{stroopsToXlm(c.total_raised)} XLM</span>
                                            <StatusBadge status={displayStatus} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
