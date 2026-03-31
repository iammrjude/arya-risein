import { Link } from 'react-router-dom'
import styles from './StakingPages.module.css'

const POOL_COPY = {
  xlm: {
    title: 'XLM Reward Pool',
    description: 'Stake ARYA to earn protocol fees collected in XLM from crowdfunding and launchpad settlements.',
    accentLabel: 'Rewards settle in XLM',
  },
  usdc: {
    title: 'USDC Reward Pool',
    description: 'Stake ARYA to earn protocol fees collected in USDC, keeping stablecoin rewards separate from XLM.',
    accentLabel: 'Rewards settle in USDC',
  },
}

export default function StakingRewardPoolPage({ rewardAsset }) {
  const pool = POOL_COPY[rewardAsset]

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.poolCard}>
          <p className={styles.kicker}>{pool.accentLabel}</p>
          <h1 className={styles.title}>{pool.title}</h1>
          <p className={styles.subtitle}>{pool.description}</p>

          <div className={styles.grid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Staking design</span>
              <strong className={styles.metricValue}>Upgradeable</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Reward accounting</span>
              <strong className={styles.metricValue}>Per-share accrual</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Lockup support</span>
              <strong className={styles.metricValue}>Enabled</strong>
            </div>
          </div>

          <div className={styles.notice}>
            Full wallet staking interactions will be wired to the new testnet suite after deployment. This page is
            already part of the new information architecture so the navigation and module discoverability are final.
          </div>

          <div className={styles.actions}>
            <Link to="/staking/dashboard" className={styles.primary}>Open staking dashboard</Link>
            <Link to="/staking/overview" className={styles.secondary}>Read staking overview</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
