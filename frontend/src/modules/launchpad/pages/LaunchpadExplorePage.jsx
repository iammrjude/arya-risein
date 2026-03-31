import { Link } from 'react-router-dom'
import StatusBadge from '../../../components/StatusBadge/StatusBadge'
import { useSales } from '../../../hooks/useContract'
import { assetCodeFromFundingAsset, formatAmountForFundingAsset } from '../../../utils/format'
import { formatDate, getCountdown } from '../../../utils/time'
import styles from './LaunchpadPages.module.css'

function deriveSaleStatus(sale) {
  const now = Math.floor(Date.now() / 1000)
  if (sale.status !== 'Active') return sale.status
  if (now < Number(sale.start_time)) return 'Scheduled'
  if (now > Number(sale.end_time)) {
    return Number(sale.total_raised) >= Number(sale.soft_cap) ? 'Awaiting Settlement' : 'Refund Window'
  }
  return 'Live'
}

export default function LaunchpadExplorePage() {
  const { sales, loading, error, refresh } = useSales()

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.kicker}>Launchpad</p>
          <h1 className={styles.title}>Live token sales on Stellar with refund protection and staking revenue share.</h1>
          <p className={styles.subtitle}>
            Browse sales, inspect funding windows, and open the project view to contribute, claim refunds, or settle
            completed launches.
          </p>
        </div>

        <div className={styles.toolbar}>
          <Link to="/launchpad/create" className={styles.primaryCta}>Create Sale</Link>
          <button className={styles.secondaryCta} onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Sales'}
          </button>
        </div>

        {error && <div className={styles.errorBox}>Failed to load launchpad sales: {error}</div>}

        {!loading && sales.length === 0 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>No launchpad sales yet</h2>
            <p className={styles.cardText}>
              Create the first sale from the creator page after wiring the launchpad contract ID and funding token
              addresses.
            </p>
          </div>
        )}

        <div className={styles.grid}>
          {sales.map(sale => {
            const progress = Number(sale.hard_cap) > 0 ? (Number(sale.total_raised) / Number(sale.hard_cap)) * 100 : 0
            const countdown = getCountdown(sale.end_time)
            const fundingAsset = assetCodeFromFundingAsset(sale.funding_asset)
            const displayStatus = deriveSaleStatus(sale)

            return (
              <Link key={sale.id} to={`/launchpad/project/${sale.id}`} className={styles.cardLink}>
                <article className={styles.card}>
                  <div className={styles.rowBetween}>
                    <div>
                      <p className={styles.miniLabel}>Sale #{sale.id}</p>
                      <h2 className={styles.cardTitle}>{fundingAsset} sale</h2>
                    </div>
                    <StatusBadge status={displayStatus} />
                  </div>

                  <div className={styles.metricGrid}>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>Raised</span>
                      <strong className={styles.metricValue}>{formatAmountForFundingAsset(sale.total_raised, sale.funding_asset)}</strong>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>Soft Cap</span>
                      <strong className={styles.metricValue}>{formatAmountForFundingAsset(sale.soft_cap, sale.funding_asset)}</strong>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricLabel}>Hard Cap</span>
                      <strong className={styles.metricValue}>{formatAmountForFundingAsset(sale.hard_cap, sale.funding_asset)}</strong>
                    </div>
                  </div>

                  <div className={styles.progressWrap}>
                    <div className={styles.progressBar}>
                      <span className={styles.progressFill} style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                    <span className={styles.progressText}>{progress.toFixed(1)}% of hard cap</span>
                  </div>

                  <div className={styles.rowBetween}>
                    <span className={styles.cardText}>Ends {formatDate(sale.end_time)}</span>
                    <span className={styles.cardText}>
                      {countdown.expired ? 'Ended' : `${countdown.days}d ${countdown.hours}h left`}
                    </span>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
