import { Link } from 'react-router-dom'
import styles from './InfoPages.module.css'

const SECTIONS = [
  {
    title: 'Crowdfunding',
    body:
      'Arya crowdfunding lets organizers create XLM or USDC campaigns with contract-defined goals, deadlines, refunds, and organizer actions. The core idea is that campaign outcomes should be enforced by code rather than platform discretion.',
  },
  {
    title: 'Launchpad',
    body:
      'The launchpad module supports token sale fundraising with soft caps, hard caps, refunds, and treasury plus staking fee flows. It extends Arya beyond crowdfunding into broader capital formation.',
  },
  {
    title: 'Staking',
    body:
      'ARYA staking distributes protocol rewards through dedicated pools. This gives the token utility inside the ecosystem and creates a direct connection between platform activity and holder participation.',
  },
  {
    title: 'Treasury',
    body:
      'The treasury page manages the ARYA treasury wallet and liquidity context. It connects protocol-level capital management with the rest of the platform modules.',
  },
  {
    title: 'Admin controls',
    body:
      'Admin pages expose the owner-only functions that update platform settings across contracts. This includes fee settings, treasury addresses, staking addresses, action windows, ownership transfers, and the additional setters added for launchpad, staking, and registry.',
  },
]

const PRINCIPLES = [
  'Transparent fundraising rules beat discretionary moderation.',
  'Campaign success and failure paths should be visible before people contribute.',
  'On-chain records make verification easier than private internal ledgers.',
  'Platform growth should feed back into staking and token utility.',
]

export default function DocsPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Docs</span>
        <h1 className={styles.title}>How Arya works as a connected fundraising ecosystem.</h1>
        <p className={styles.subtitle}>
          Arya combines decentralized crowdfunding, launchpad fundraising, ARYA staking, treasury operations, and contract administration into one modular product.
        </p>
      </section>

      <section className={styles.content}>
        <div className={styles.callout}>
          <h2 className={styles.calloutTitle}>Core principles</h2>
          <ul className={styles.bullets}>
            {PRINCIPLES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className={styles.stack}>
          {SECTIONS.map((section) => (
            <article key={section.title} className={styles.card}>
              <h2 className={styles.cardTitle}>{section.title}</h2>
              <p className={styles.cardText}>{section.body}</p>
            </article>
          ))}
        </div>

        <div className={styles.callout}>
          <h2 className={styles.calloutTitle}>Next stops</h2>
          <p className={styles.calloutText}>
            Explore the live crowdfunding module, or open the FAQ if you want the quick trust-and-safety version first.
          </p>
          <div className={styles.links}>
            <Link to="/crowdfunding" className={styles.linkButton}>Explore Crowdfunding</Link>
            <Link to="/faq" className={styles.linkButtonSecondary}>Read FAQ</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
