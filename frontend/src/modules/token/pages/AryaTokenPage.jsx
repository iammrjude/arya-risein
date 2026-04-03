import { useEffect, useState } from 'react'
import styles from './AryaTokenPage.module.css'
import { ARYA_TOKEN_ID, PLATFORM_OWNER } from '../../../contract/config'
import { getAryaSwapQuote, getAryaXlmPoolStatus, swapAryaAgainstXlm } from '../../../contract/client'
import { useWallet } from '../../../hooks/useWallet'
import TxStatus from '../../../components/TxStatus/TxStatus'
import { truncateAddress } from '../../../utils/stellar'

const TOKENOMICS = [
  { label: 'Total Supply', value: '100,000,000 ARYA' },
  { label: 'Treasury Starting Balance', value: '45,000,000 ARYA' },
  { label: 'Initial ARYA/XLM Liquidity', value: '500,000 ARYA + 5,000 XLM' },
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

const SWAP_DIRECTIONS = {
  buy: {
    label: 'Buy ARYA',
    payLabel: 'You pay in XLM',
    receiveLabel: 'You receive ARYA',
  },
  sell: {
    label: 'Sell ARYA',
    payLabel: 'You pay in ARYA',
    receiveLabel: 'You receive XLM',
  },
}

export default function AryaTokenPage() {
  const { getAddress, signTransaction } = useWallet()
  const [address, setAddress] = useState(null)
  const [swapDirection, setSwapDirection] = useState('buy')
  const [swapAmount, setSwapAmount] = useState('')
  const [quote, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [swapStatus, setSwapStatus] = useState(null)
  const [swapHash, setSwapHash] = useState(null)
  const [swapError, setSwapError] = useState(null)
  const [poolStatus, setPoolStatus] = useState(null)

  const livePoolPrice = poolStatus?.poolExists && Number(poolStatus.aryaReserve) > 0
    ? Number(poolStatus.xlmReserve) / Number(poolStatus.aryaReserve)
    : null

  const tokenomics = [
    ...TOKENOMICS,
    {
      label: 'Live Pool Price',
      value: livePoolPrice === null
        ? 'Awaiting liquidity'
        : `1 ARYA = ${livePoolPrice.toLocaleString('en-US', { maximumFractionDigits: 7 })} XLM`,
    },
  ]

  useEffect(() => {
    async function loadAddress() {
      const nextAddress = await getAddress()
      setAddress(nextAddress)
    }

    loadAddress()
    const interval = setInterval(loadAddress, 2000)
    return () => clearInterval(interval)
  }, [getAddress])

  useEffect(() => {
    let cancelled = false

    async function loadPoolStatus() {
      try {
        const nextPoolStatus = await getAryaXlmPoolStatus()
        if (!cancelled) {
          setPoolStatus(nextPoolStatus)
        }
      } catch {
        if (!cancelled) {
          setPoolStatus(null)
        }
      }
    }

    loadPoolStatus()
    const interval = setInterval(loadPoolStatus, 15000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadQuote() {
      if (!swapAmount.trim()) {
        setQuote(null)
        setQuoteError(null)
        return
      }

      setQuoteLoading(true)
      setQuoteError(null)
      try {
        const nextQuote = await getAryaSwapQuote({ direction: swapDirection, amount: swapAmount })
        if (!cancelled) {
          setQuote(nextQuote)
          if (!nextQuote) {
            setQuoteError('No live route is available for this swap amount right now.')
          }
        }
      } catch (err) {
        if (!cancelled) {
          setQuote(null)
          setQuoteError(err.message)
        }
      } finally {
        if (!cancelled) {
          setQuoteLoading(false)
        }
      }
    }

    loadQuote()
    return () => {
      cancelled = true
    }
  }, [swapAmount, swapDirection])

  async function handleSwap() {
    if (!address) {
      setSwapStatus('error')
      setSwapError('Connect a wallet before swapping.')
      return
    }

    setSwapStatus('pending')
    setSwapHash(null)
    setSwapError(null)

    try {
      const result = await swapAryaAgainstXlm({
        walletAddress: address,
        direction: swapDirection,
        amount: swapAmount,
        signTransaction,
      })
      setSwapStatus('success')
      setSwapHash(result.hash)
    } catch (err) {
      setSwapStatus('error')
      setSwapError(err.message)
    }
  }

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
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>ARYA/XLM Pool ID</span>
              <strong className={styles.metricValue}>{poolStatus?.poolId || 'Loading...'}</strong>
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
            {tokenomics.map(item => (
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
            <div className={styles.swapMeta}>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Pool Status</span>
                <strong className={styles.metricValue}>{poolStatus?.poolExists ? 'Live' : 'Awaiting liquidity'}</strong>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.metricLabel}>Pool Reserves</span>
                <strong className={styles.metricValue}>
                  {poolStatus ? `${poolStatus.aryaReserve.toLocaleString('en-US', { maximumFractionDigits: 2 })} ARYA / ${poolStatus.xlmReserve.toLocaleString('en-US', { maximumFractionDigits: 2 })} XLM` : 'Loading...'}
                </strong>
              </article>
            </div>

            <div className={styles.toggleRow}>
              {Object.entries(SWAP_DIRECTIONS).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.toggleButton} ${swapDirection === key ? styles.toggleActive : ''}`}
                  onClick={() => setSwapDirection(key)}
                >
                  {config.label}
                </button>
              ))}
            </div>

            <div className={styles.swapPanel}>
              <div className={styles.swapField}>
                <span className={styles.metricLabel}>{SWAP_DIRECTIONS[swapDirection].payLabel}</span>
                <input
                  value={swapAmount}
                  onChange={(event) => setSwapAmount(event.target.value)}
                  className={styles.swapInput}
                  placeholder={swapDirection === 'buy' ? '25.0' : '250.0'}
                />
              </div>

              <div className={styles.swapField}>
                <span className={styles.metricLabel}>{SWAP_DIRECTIONS[swapDirection].receiveLabel}</span>
                <div className={styles.swapQuoteValue}>
                  {quoteLoading && 'Fetching route...'}
                  {!quoteLoading && quote?.destinationAmount && `${Number(quote.destinationAmount).toLocaleString('en-US', { maximumFractionDigits: 7 })} ${quote.destinationAssetLabel}`}
                  {!quoteLoading && !quote?.destinationAmount && 'Enter an amount to fetch a route'}
                </div>
              </div>
            </div>

            <div className={styles.swapDetails}>
              <p className={styles.listItem}>
                Connected wallet: {address ? truncateAddress(address, 8, 8) : 'Connect a wallet to swap'}
              </p>
              <p className={styles.listItem}>Default slippage protection: 1.00%</p>
              {quoteError && <p className={styles.inlineError}>{quoteError}</p>}
            </div>

            <button
              type="button"
              className={styles.swapButton}
              onClick={handleSwap}
              disabled={!swapAmount || quoteLoading || !quote}
            >
              {SWAP_DIRECTIONS[swapDirection].label}
            </button>
          </article>
        </section>
      </div>

      {swapStatus && (
        <TxStatus
          status={swapStatus}
          hash={swapHash}
          error={swapError}
          onClose={() => {
            setSwapStatus(null)
            setSwapError(null)
          }}
        />
      )}
    </div>
  )
}
