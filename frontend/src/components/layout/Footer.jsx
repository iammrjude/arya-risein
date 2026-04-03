import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span>Arya</span>
          <span className={styles.dot}>|</span>
          <span>Built on Stellar Testnet</span>
        </div>
        <div className={styles.links}>
          <Link to="/token" className={styles.link}>ARYA</Link>
          <Link to="/crowdfunding" className={styles.link}>Crowdfunding</Link>
          <Link to="/launchpad" className={styles.link}>Launchpad</Link>
          <Link to="/staking/overview" className={styles.link}>Staking</Link>
          <Link to="/faq" className={styles.link}>FAQ</Link>
          <Link to="/docs" className={styles.link}>Docs</Link>
          <Link to="/treasury" className={styles.link}>Treasury</Link>
          <Link to="/admin" className={styles.link}>Admin</Link>
        </div>
      </div>
    </footer>
  )
}
