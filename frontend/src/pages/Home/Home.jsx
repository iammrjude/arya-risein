import { useState } from 'react'
import { Link } from 'react-router-dom'
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
                    Back projects through transparent smart contract rules on Stellar, with campaign outcomes that donors and organizers can verify for themselves.
                </p>
            </div>

            <div className={styles.container}>
                <section className={styles.whySection}>
                    <div className={styles.whyIntro}>
                        <span className={styles.whyEyebrow}>Why decentralized crowdfunding</span>
                        <h2 className={styles.whyTitle}>No opaque freeze decisions. No surprise fund redirections. Just predefined campaign rules.</h2>
                        <p className={styles.whyText}>
                            Arya is built so contributors know what happens before they fund. Campaign success, refunds, and deadline extensions are handled by contract logic that is visible on-chain and enforced the same way for everyone.
                        </p>
                    </div>

                    <div className={styles.whyGrid}>
                        <article className={styles.whyCard}>
                            <h3 className={styles.whyCardTitle}>Contract-held funds</h3>
                            <p className={styles.whyCardText}>
                                Contributions move into the smart contract, reducing reliance on a centralized platform deciding when funds can move.
                            </p>
                        </article>
                        <article className={styles.whyCard}>
                            <h3 className={styles.whyCardTitle}>Clear success and refund paths</h3>
                            <p className={styles.whyCardText}>
                                If a goal is met, organizers withdraw. If a goal is missed, donors refund. If a campaign raises enough momentum, the extension window is predefined.
                            </p>
                        </article>
                        <article className={styles.whyCard}>
                            <h3 className={styles.whyCardTitle}>Verifiable activity on Stellar</h3>
                            <p className={styles.whyCardText}>
                                Contributions, withdrawals, and refunds are traceable, giving supporters a clearer audit trail than a private internal ledger.
                            </p>
                        </article>
                    </div>

                    <div className={styles.whyActions}>
                        <Link to="/faq" className={styles.infoLink}>Read the FAQ -&gt;</Link>
                        <Link to="/docs" className={styles.infoLink}>Learn how it works -&gt;</Link>
                    </div>
                </section>

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
