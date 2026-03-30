import { Link } from 'react-router-dom'
import styles from './LaunchpadPages.module.css'

export default function LaunchpadExplorePage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.kicker}>Launchpad</p>
          <h1 className={styles.title}>Single-asset token sales designed for safer Stellar launches.</h1>
          <p className={styles.subtitle}>
            Launchpad sales will support XLM or USDC per sale, soft and hard caps, contributor refunds, and revenue
            sharing into the ARYA staking pools.
          </p>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>What ships in v1</h2>
            <ul className={styles.list}>
              <li>One funding asset per sale</li>
              <li>Soft cap and hard cap protection</li>
              <li>Contributor refund path on failure</li>
              <li>Automatic treasury and staking fee split</li>
            </ul>
          </div>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Recommended flow</h2>
            <p className={styles.cardText}>
              Projects create a sale, preload inventory, accept contributions during the live window, and settle after
              the sale closes. Token claims and refund flows remain transparent on-chain.
            </p>
            <Link to="/launchpad/create" className={styles.cta}>Open creator view →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
