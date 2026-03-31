import { Link } from 'react-router-dom'
import { useRegistryConfig, useStakingOverview } from '../../../hooks/useContract'
import { formatAmountForFundingAsset } from '../../../utils/format'
import styles from './StakingPages.module.css'

export default function StakingOverviewPage() {
  const { settings, totalStaked, pools, loading, error } = useStakingOverview()
  const { config } = useRegistryConfig()

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <p className={styles.kicker}>ARYA Staking</p>
          <h1 className={styles.title}>Stake ARYA and track XLM and USDC reward pools from one dashboard.</h1>
          <p className={styles.subtitle}>
            Crowdfunding and launchpad fee flows are routed into staking reward pools. Use the live pool pages to
            inspect accruals and the dashboard to manage your position.
          </p>
        </div>

        {error && <div className={styles.errorBox}>Failed to load staking overview: {error}</div>}

        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Total Staked</span>
            <strong className={styles.metricValue}>{loading || totalStaked === null ? '...' : totalStaked.toString()}</strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Minimum Lockup</span>
            <strong className={styles.metricValue}>{settings ? `${settings.min_lockup_days} days` : '...'}</strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Stake Token</span>
            <strong className={styles.metricValue}>{config?.arya_token || settings?.stake_token || 'Not configured'}</strong>
          </div>
        </div>

        {pools && (
          <div className={styles.poolsGrid}>
            <div className={styles.poolCard}>
              <p className={styles.kicker}>XLM Pool</p>
              <h2 className={styles.cardTitle}>Crowdfunding and launchpad XLM fees</h2>
              <div className={styles.poolStats}>
                <p className={styles.notice}>Deposited rewards: {formatAmountForFundingAsset(pools.Xlm.deposited_rewards, 'Xlm')}</p>
                <p className={styles.notice}>Queued rewards: {formatAmountForFundingAsset(pools.Xlm.queued_rewards, 'Xlm')}</p>
              </div>
              <Link to="/staking/xlm" className={styles.primary}>Open XLM rewards</Link>
            </div>

            <div className={styles.poolCard}>
              <p className={styles.kicker}>USDC Pool</p>
              <h2 className={styles.cardTitle}>Crowdfunding and launchpad USDC fees</h2>
              <div className={styles.poolStats}>
                <p className={styles.notice}>Deposited rewards: {formatAmountForFundingAsset(pools.Usdc.deposited_rewards, 'Usdc')}</p>
                <p className={styles.notice}>Queued rewards: {formatAmountForFundingAsset(pools.Usdc.queued_rewards, 'Usdc')}</p>
              </div>
              <Link to="/staking/usdc" className={styles.primary}>Open USDC rewards</Link>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Link to="/staking/dashboard" className={styles.primary}>Open staking dashboard</Link>
          <Link to="/launchpad" className={styles.secondary}>View launchpad sales</Link>
        </div>
      </div>
    </div>
  )
}
