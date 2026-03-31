import styles from './LaunchpadPages.module.css'

export default function LaunchpadDashboardPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.kicker}>Launchpad Dashboard</p>
          <h1 className={styles.title}>Dashboard placeholder for live sales and settlements.</h1>
          <p className={styles.cardText}>
            Project-level performance, claims, and post-sale settlement actions will live here after the new contracts
            are configured in the frontend.
          </p>
        </div>
      </div>
    </div>
  )
}
