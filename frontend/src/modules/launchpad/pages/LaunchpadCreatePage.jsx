import styles from './LaunchpadPages.module.css'

export default function LaunchpadCreatePage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.kicker}>Launchpad Creator</p>
          <h1 className={styles.title}>Creator flow will connect after testnet suite deployment.</h1>
          <p className={styles.cardText}>
            The contract layer for launchpad is in place. This page is reserved for the full create-sale form once the
            new testnet contract addresses are wired into the frontend configuration and event stream.
          </p>
        </div>
      </div>
    </div>
  )
}
