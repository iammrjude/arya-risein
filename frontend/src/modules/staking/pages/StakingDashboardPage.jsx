import styles from './StakingPages.module.css'

export default function StakingDashboardPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.poolCard}>
          <p className={styles.kicker}>My Positions</p>
          <h1 className={styles.title}>Staking dashboard</h1>
          <p className={styles.subtitle}>
            Position tracking, claims, lockups, and reward summaries will appear here once the new staking contract is
            deployed and connected to the frontend event stream.
          </p>
        </div>
      </div>
    </div>
  )
}
