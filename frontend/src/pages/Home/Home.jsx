import { useState } from 'react'
import { useCampaigns } from '../../hooks/useContract'
import CampaignCard from '../../components/CampaignCard/CampaignCard'
import styles from './Home.module.css'

const FILTERS = ['All', 'Active', 'Successful', 'Failed']

export default function Home() {
    const { campaigns, loading, error, refresh } = useCampaigns()
    const [filter, setFilter] = useState('All')

    const filtered = campaigns.filter(c => {
        if (filter === 'All') return true
        const status = c.status
        return status.toLowerCase() === filter.toLowerCase()
    })

    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <h1 className={styles.heroTitle}>Decentralized Crowdfunding</h1>
                <p className={styles.heroSubtitle}>
                    Fund projects trustlessly on the Stellar network with XLM or USDC, protected by smart contracts.
                </p>
            </div>

            <div className={styles.container}>
                <div className={styles.toolbar}>
                    <div className={styles.filters}>
                        {FILTERS.map(f => (
                            <button
                                key={f}
                                className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <button className={styles.refreshBtn} onClick={refresh} disabled={loading}>
                        {loading ? <span className={styles.spinner} /> : '↻ Refresh'}
                    </button>
                </div>

                {error && (
                    <div className={styles.error}>
                        Failed to load campaigns: {error}
                    </div>
                )}

                {loading && !campaigns.length && (
                    <div className={styles.grid}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={styles.skeleton} />
                        ))}
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>◈</span>
                        <p>No {filter !== 'All' ? filter.toLowerCase() : ''} campaigns found.</p>
                    </div>
                )}

                {filtered.length > 0 && (
                    <div className={styles.grid}>
                        {filtered.map(campaign => (
                            <CampaignCard key={campaign.id} campaign={campaign} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
