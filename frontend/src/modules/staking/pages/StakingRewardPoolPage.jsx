import { Link } from 'react-router-dom'
import { useStakingOverview } from '../../../hooks/useContract'
import { formatAmountForFundingAsset } from '../../../utils/format'
import styles from './StakingPages.module.css'

const POOL_COPY = {
  xlm: {
    key: 'Xlm',
    title: 'XLM Reward Pool',
    description: 'Track rewards sourced from crowdfunding and launchpad flows that settle in XLM.',
  },
  usdc: {
    key: 'Usdc',
    title: 'USDC Reward Pool',
    description: 'Track stablecoin rewards distributed to ARYA stakers through the USDC pool.',
  },
}

export default function StakingRewardPoolPage({ rewardAsset }) {
  const poolMeta = POOL_COPY[rewardAsset]
  const { pools, loading, error } = useStakingOverview()
  const pool = pools?.[poolMeta.key]

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.poolCard}>
          <p className={styles.kicker}>{poolMeta.key} rewards</p>
          <h1 className={styles.title}>{poolMeta.title}</h1>
          <p className={styles.subtitle}>{poolMeta.description}</p>

          {error && <div className={styles.errorBox}>Failed to load pool data: {error}</div>}

          <div className={styles.grid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Reward Token</span>
              <strong className={styles.metricValue}>{pool?.reward_token || (loading ? '...' : 'Unavailable')}</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Deposited Rewards</span>
              <strong className={styles.metricValue}>{pool ? formatAmountForFundingAsset(pool.deposited_rewards, poolMeta.key) : '...'}</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Queued Rewards</span>
              <strong className={styles.metricValue}>{pool ? formatAmountForFundingAsset(pool.queued_rewards, poolMeta.key) : '...'}</strong>
            </div>
          </div>

          <div className={styles.notice}>
            Reward accounting is per-share. Queue values remain undistributed until at least one active staker exists,
            after which they settle into `reward_per_token`.
          </div>

          <div className={styles.actions}>
            <Link to="/staking/dashboard" className={styles.primary}>Manage my position</Link>
            <Link to="/staking/overview" className={styles.secondary}>Back to overview</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
