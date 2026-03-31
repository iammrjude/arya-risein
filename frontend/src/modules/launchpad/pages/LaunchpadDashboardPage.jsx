import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../../../components/StatusBadge/StatusBadge'
import { useSales } from '../../../hooks/useContract'
import { useWallet } from '../../../hooks/useWallet'
import { assetCodeFromFundingAsset, formatAmountForFundingAsset } from '../../../utils/format'
import styles from './LaunchpadPages.module.css'

function getDisplayStatus(sale) {
  const now = Math.floor(Date.now() / 1000)
  if (sale.status !== 'Active') return sale.status
  if (now < Number(sale.start_time)) return 'Scheduled'
  if (now > Number(sale.end_time)) {
    return Number(sale.total_raised) >= Number(sale.soft_cap) ? 'Awaiting Settlement' : 'Refund Window'
  }
  return 'Live'
}

export default function LaunchpadDashboardPage() {
  const { sales, loading } = useSales()
  const { getAddress } = useWallet()
  const [address, setAddress] = useState(null)

  useEffect(() => {
    async function loadAddress() {
      setAddress(await getAddress())
    }
    loadAddress()
  }, [getAddress])

  const mySales = sales.filter(sale => address && sale.project_owner === address)

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.rowBetween}>
          <div className={styles.header}>
            <p className={styles.kicker}>Launchpad Dashboard</p>
            <h1 className={styles.title}>Manage your launchpad sales</h1>
            <p className={styles.subtitle}>
              Review sale performance, settlement state, and jump straight into each project detail page.
            </p>
          </div>
          <Link to="/launchpad/create" className={styles.primaryCta}>Create Sale</Link>
        </div>

        {!address && <div className={styles.card}>Connect your wallet to see your launchpad sales.</div>}
        {address && !loading && mySales.length === 0 && <div className={styles.card}>You have not created any launchpad sales yet.</div>}

        <div className={styles.grid}>
          {mySales.map(sale => (
            <article key={sale.id} className={styles.card}>
              <div className={styles.rowBetween}>
                <div>
                  <p className={styles.miniLabel}>Sale #{sale.id}</p>
                  <h2 className={styles.cardTitle}>{assetCodeFromFundingAsset(sale.funding_asset)} funding sale</h2>
                </div>
                <StatusBadge status={getDisplayStatus(sale)} />
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
              <Link to={`/launchpad/project/${sale.id}`} className={styles.inlineLink}>Open project view</Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
