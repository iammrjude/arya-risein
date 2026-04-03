import { Link } from 'react-router-dom'
import styles from './InfoPages.module.css'

const FAQS = [
  {
    question: 'What makes Arya different from a centralized crowdfunding platform?',
    answer:
      'Arya uses smart contracts to define campaign outcomes ahead of time. Contributions, refunds, and withdrawals follow visible contract rules instead of depending on a platform team making discretionary decisions behind the scenes.',
  },
  {
    question: 'Can Arya freeze a campaign or redirect funds to another destination?',
    answer:
      'Campaign outcomes are governed by contract logic, not by an internal support queue. The platform does have admin controls for platform settings, but campaign success, refunds, and withdrawal paths are intended to follow the crowdfunding contract rules.',
  },
  {
    question: 'What happens if a campaign reaches its goal?',
    answer:
      'Once the funding goal is met and the campaign closes successfully, the organizer can withdraw according to the contract flow. Successful campaigns also pay the protocol fee defined by the platform settings.',
  },
  {
    question: 'What happens if a campaign misses its goal?',
    answer:
      'Donors can claim refunds according to the contract rules. This makes failure outcomes explicit and reduces the uncertainty that can happen on opaque fundraising platforms.',
  },
  {
    question: 'What is the extension window?',
    answer:
      'If a campaign raises enough momentum but misses the deadline, the organizer may have a limited action window to extend it. That window is part of the contract configuration and is visible to the platform admin.',
  },
  {
    question: 'Which assets can campaigns use?',
    answer:
      'The current platform is designed around XLM and USDC flows, with smart contract settings controlling which assets the crowdfunding and launchpad modules use.',
  },
  {
    question: 'How can I verify what happened in a campaign?',
    answer:
      'Campaign interactions are executed on Stellar. That means users can inspect transaction history and contract-driven events instead of relying only on platform messaging.',
  },
]

export default function FAQPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>FAQ</span>
        <h1 className={styles.title}>Questions people ask before they trust a crowdfunding platform.</h1>
        <p className={styles.subtitle}>
          Arya is designed to make campaign rules more predictable, transparent, and verifiable. This page explains the key ideas in plain language.
        </p>
      </section>

      <section className={styles.content}>
        <div className={styles.stack}>
          {FAQS.map((item) => (
            <article key={item.question} className={styles.card}>
              <h2 className={styles.cardTitle}>{item.question}</h2>
              <p className={styles.cardText}>{item.answer}</p>
            </article>
          ))}
        </div>

        <div className={styles.callout}>
          <h2 className={styles.calloutTitle}>Want the full product explanation?</h2>
          <p className={styles.calloutText}>
            Read the docs for a deeper walkthrough of the crowdfunding, launchpad, staking, treasury, and admin flows.
          </p>
          <div className={styles.links}>
            <Link to="/docs" className={styles.linkButton}>Open Docs</Link>
            <Link to="/crowdfunding" className={styles.linkButtonSecondary}>Explore Crowdfunding</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
