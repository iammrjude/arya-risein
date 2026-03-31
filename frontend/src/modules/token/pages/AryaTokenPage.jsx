import styles from './AryaTokenPage.module.css'
import { ARYA_TOKEN_ID, PLATFORM_OWNER } from '../../../contract/config'

const TOKENOMICS = [
  { label: 'Total Supply', value: '100,000,000 ARYA' },
  { label: 'Treasury Starting Balance', value: '45,000,000 ARYA' },
  { label: 'Initial ARYA/XLM Liquidity', value: '500,000 ARYA + 5,000 XLM' },
  { label: 'Opening Pool Price', value: '1 ARYA = 0.01 XLM' },
]

const UTILITY = [
  'Stake ARYA to participate in protocol reward distribution.',
  'Use treasury-funded ARYA liquidity to support buy and sell access against XLM.',
  'Power future launchpad, governance, and ecosystem incentive programs.',
]

const TRUSTLINE_STEPS = [
  'Open a Stellar wallet on testnet and make sure the account is funded.',
  'Add the custom asset with code ARYA.',
  `Use issuer ${PLATFORM_OWNER} when the wallet asks for the issuing address.`,
  'After the trustline is active, the wallet can receive ARYA and later swap against the ARYA/XLM pool.',
]

export default function AryaTokenPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>ARYA Token</h1>
        <p className={styles.heroSubtitle}>
          The treasury-backed utility asset for staking, liquidity, and ecosystem growth across the Arya platform.
        </p>
      </section>

      <div className={styles.container}>
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Token Details</h2>
          <div className={styles.metricGrid}>
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>ARYA Token / SAC</span>
              <strong className={styles.metricValue}>{ARYA_TOKEN_ID || 'Not configured'}</strong>
            </article>
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>Issuer</span>
              <strong className={styles.metricValue}>{PLATFORM_OWNER || 'Not configured'}</strong>
            </article>
          </div>
          <p className={styles.bodyText}>
            ARYA is issued as a Stellar asset and mirrored by its Stellar Asset Contract so the Arya platform can use one token across wallet UX,
            staking rewards, treasury operations, and future swap flows.
          </p>
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Tokenomics</h2>
          <div className={styles.metricGrid}>
            {TOKENOMICS.map(item => (
              <article key={item.label} className={styles.metricCard}>
                <span className={styles.metricLabel}>{item.label}</span>
                <strong className={styles.metricValue}>{item.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Utility</h2>
          <div className={styles.listCard}>
            {UTILITY.map(point => (
              <p key={point} className={styles.listItem}>{point}</p>
            ))}
          </div>
        </section>

        <section className={styles.dualGrid}>
          <article className={styles.card}>
            <h2 className={styles.sectionTitle}>Add ARYA to Wallet</h2>
            {TRUSTLINE_STEPS.map(step => (
              <p key={step} className={styles.listItem}>{step}</p>
            ))}
          </article>
          <article className={styles.card}>
            <h2 className={styles.sectionTitle}>Swap & Liquidity</h2>
            <p className={styles.listItem}>
              The initial liquidity plan seeds the ARYA/XLM pool from the treasury wallet with 500,000 ARYA and 5,000 XLM.
            </p>
            <p className={styles.listItem}>
              That launch ratio establishes the opening AMM price, after which Stellar path payments and pool trades move the market price.
            </p>
            <p className={styles.listItem}>
              A dedicated swap experience can be layered on top of this page later, but the token details and trustline instructions belong here now.
            </p>
          </article>
        </section>
      </div>
    </div>
  )
}
