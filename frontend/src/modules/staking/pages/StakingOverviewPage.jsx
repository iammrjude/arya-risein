import { Link } from 'react-router-dom'
import styles from './StakingPages.module.css'

export default function StakingOverviewPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <p className={styles.kicker}>ARYA Staking</p>
          <h1 className={styles.title}>Stake ARYA into separate XLM and USDC reward pools.</h1>
          <p className={styles.subtitle}>
            Protocol revenue from crowdfunding and launchpad is routed into staking reward pools based on the source
            asset, keeping accounting clean and making the reward choice obvious for users.
          </p>
        </div>
        <div className={styles.actions}>
          <Link to="/staking/xlm" className={styles.primary}>View XLM Pool</Link>
          <Link to="/staking/usdc" className={styles.secondary}>View USDC Pool</Link>
        </div>
      </div>
    </div>
  )
}
