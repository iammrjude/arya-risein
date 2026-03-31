import { Link } from 'react-router-dom'
import styles from './LandingPage.module.css'

const MODULES = [
  {
    title: 'Crowdfunding',
    description: 'Single-asset XLM or USDC campaigns with refunds, organizer controls, and staking-powered fee sharing.',
    to: '/crowdfunding',
  },
  {
    title: 'Launchpad',
    description: 'Raise capital for token launches with soft caps, hard caps, refunds, and protocol revenue flowing into staking.',
    to: '/launchpad',
  },
  {
    title: 'Staking',
    description: 'Stake ARYA to earn protocol rewards in separate XLM and USDC pools, with upgrade-ready reward accounting.',
    to: '/staking/xlm',
  },
]

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <p className={styles.kicker}>Arya on Stellar</p>
        <h1 className={styles.title}>Crowdfunding, launchpad, and ARYA staking in one modular platform.</h1>
        <p className={styles.subtitle}>
          Arya expands the original crowdfunding prototype into an upgradeable multi-product ecosystem with shared treasury logic,
          staking rewards, and discoverable mobile-first navigation.
        </p>
        <div className={styles.actions}>
          <Link to="/crowdfunding" className={styles.primaryCta}>Explore Crowdfunding</Link>
          <Link to="/staking/xlm" className={styles.secondaryCta}>View Staking Pools</Link>
        </div>
      </section>

      <section className={styles.grid}>
        {MODULES.map((module) => (
          <Link key={module.title} to={module.to} className={styles.card}>
            <h2 className={styles.cardTitle}>{module.title}</h2>
            <p className={styles.cardText}>{module.description}</p>
            <span className={styles.cardLink}>Open module →</span>
          </Link>
        ))}
      </section>

      <section className={styles.roadmap}>
        <div className={styles.roadmapCard}>
          <h3 className={styles.roadmapTitle}>Coming Soon</h3>
          <p className={styles.roadmapText}>
            Leveraged staking remains part of the roadmap, but it is intentionally excluded from this implementation so
            the current release can stay safer, more auditable, and production-focused.
          </p>
        </div>
      </section>
    </div>
  )
}
