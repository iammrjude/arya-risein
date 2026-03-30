import { useParams } from 'react-router-dom'
import styles from './LaunchpadPages.module.css'

export default function LaunchpadProjectPage() {
  const { id } = useParams()

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.kicker}>Launchpad Project</p>
          <h1 className={styles.title}>Project #{id}</h1>
          <p className={styles.cardText}>
            This detail view is reserved for live launchpad sales and token claim flows once the new Arya launchpad
            contracts are deployed and connected.
          </p>
        </div>
      </div>
    </div>
  )
}
