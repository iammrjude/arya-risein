import { Link } from 'react-router-dom'
import styles from './LandingPage.module.css'

const MODULES = [
  {
    title: 'Crowdfunding',
    description: 'Single-asset XLM or USDC campaigns with refunds, organizer controls, and staking-powered fee sharing.',
    to: '/crowdfunding',
    cta: 'Explore campaigns',
  },
  {
    title: 'Launchpad',
    description: 'Raise capital for token launches with soft caps, hard caps, refunds, and protocol revenue flowing into staking.',
    to: '/launchpad',
    cta: 'Explore launches',
  },
  {
    title: 'Staking',
    description: 'Stake ARYA to earn protocol rewards in separate XLM and USDC pools, with upgrade-ready reward accounting.',
    to: '/staking/xlm',
    cta: 'View staking pools',
  },
]

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <h1 className={styles.title}>Fund the future you want to see.</h1>
        <p className={styles.subtitle}>
          Arya is where communities fund promising ideas, explore new token launches, and stake ARYA for rewards in one connected ecosystem.
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
            <span className={styles.cardLink}>{module.cta} -&gt;</span>
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

      <section className={styles.story}>
        <div className={styles.storyHeader}>
          <span className={styles.storyEyebrow}>Why Arya exists</span>
          <h2 className={styles.storyTitle}>Crowdfunding should run by transparent rules, not platform discretion.</h2>
          <p className={styles.storyText}>
            Arya was built for communities that want predictable fundraising. Smart contracts define what happens when a campaign succeeds,
            misses its goal, or needs an extension window, so donors and organizers are not left guessing what a centralized platform might do next.
          </p>
        </div>

        <div className={styles.storyGrid}>
          <article className={styles.storyCard}>
            <h3 className={styles.storyCardTitle}>Funds stay governed by code</h3>
            <p className={styles.storyCardText}>
              Campaign funds are held by the contract, not by a company balance sheet or an internal moderation queue.
            </p>
          </article>
          <article className={styles.storyCard}>
            <h3 className={styles.storyCardTitle}>Outcomes are predefined</h3>
            <p className={styles.storyCardText}>
              Goal met means organizers can withdraw. Goal missed means donors can refund. Extension logic is visible before anyone contributes.
            </p>
          </article>
          <article className={styles.storyCard}>
            <h3 className={styles.storyCardTitle}>Everything is publicly verifiable</h3>
            <p className={styles.storyCardText}>
              Contributions, withdrawals, and refunds are all visible on Stellar, making trust something users can verify instead of simply hope for.
            </p>
          </article>
        </div>

        <div className={styles.storyActions}>
          <Link to="/faq" className={styles.storyLink}>Read the FAQ -&gt;</Link>
          <Link to="/docs" className={styles.storyLink}>Open the docs -&gt;</Link>
        </div>
      </section>
    </div>
  )
}
