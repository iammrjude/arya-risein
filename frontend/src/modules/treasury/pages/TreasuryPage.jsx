import { useEffect, useMemo, useState } from 'react'
import { usePlatformSettings, useRegistryConfig } from '../../../hooks/useContract'
import { useWallet } from '../../../hooks/useWallet'
import {
  addAryaXlmLiquidity,
  getAryaLiquiditySnapshot,
  removeAryaXlmLiquidity,
} from '../../../contract/client'
import TxStatus from '../../../components/TxStatus/TxStatus'
import { truncateAddress } from '../../../utils/stellar'
import styles from './TreasuryPage.module.css'

const INITIAL_ARYA = '500000'
const INITIAL_XLM = '5000'
const REMOVE_LIQUIDITY_PRESETS = [25, 50, 75, 100]

function formatMaybeNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Not available'
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: digits })
}

function formatPoolShareInput(value) {
  if (!Number.isFinite(value)) return ''
  if (value <= 0) return '0'
  return value.toFixed(7).replace(/\.?0+$/, '')
}

export default function TreasuryPage() {
  const [address, setAddress] = useState(null)
  const { settings } = usePlatformSettings()
  const { config: registryConfig } = useRegistryConfig()
  const { getAddress, signTransaction } = useWallet()
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(false)
  const [snapshotError, setSnapshotError] = useState(null)
  const [aryaLiquidityAmount, setAryaLiquidityAmount] = useState(INITIAL_ARYA)
  const [xlmLiquidityAmount, setXlmLiquidityAmount] = useState(INITIAL_XLM)
  const [poolSharesAmount, setPoolSharesAmount] = useState('')
  const [txStatus, setTxStatus] = useState(null)
  const [txHash, setTxHash] = useState(null)
  const [txError, setTxError] = useState(null)

  const treasuryWallet = settings?.treasury_wallet || registryConfig?.treasury || ''
  const isTreasury = Boolean(address && treasuryWallet && address === treasuryWallet)
  const numericPoolShareBalance = Number(snapshot?.treasuryPoolShareBalance || 0)
  const canRemoveLiquidity = numericPoolShareBalance > 0

  useEffect(() => {
    async function loadConnectedAddress() {
      const next = await getAddress()
      setAddress(next)
    }

    loadConnectedAddress()
    const interval = setInterval(loadConnectedAddress, 2000)
    return () => clearInterval(interval)
  }, [getAddress])

  async function refreshSnapshot() {
    if (!treasuryWallet) return

    setLoading(true)
    setSnapshotError(null)
    try {
      const next = await getAryaLiquiditySnapshot(treasuryWallet)
      setSnapshot(next)
    } catch (err) {
      setSnapshotError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshSnapshot()
  }, [treasuryWallet])

  const treasuryStats = useMemo(() => ([
    { label: 'Treasury Wallet', value: treasuryWallet ? truncateAddress(treasuryWallet, 8, 8) : 'Not configured' },
    { label: 'Treasury XLM', value: snapshot?.treasuryXlmBalance ?? 'Not available' },
    { label: 'Treasury ARYA', value: snapshot?.treasuryAryaBalance ?? 'Not available' },
    { label: 'Pool Share Balance', value: snapshot?.treasuryPoolShareBalance ?? '0.0000000' },
  ]), [snapshot, treasuryWallet])

  function applyRemoveLiquidityPreset(percent) {
    if (!canRemoveLiquidity) return
    const nextAmount = numericPoolShareBalance * (percent / 100)
    setPoolSharesAmount(formatPoolShareInput(nextAmount))
  }

  async function handleTreasuryAction(action) {
    setTxStatus('pending')
    setTxHash(null)
    setTxError(null)

    try {
      const result = await action()
      setTxStatus('success')
      setTxHash(result.hash)
      await refreshSnapshot()
    } catch (err) {
      setTxStatus('error')
      setTxError(err.message)
    }
  }

  if (!address) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>Connect the treasury wallet to manage ARYA/XLM liquidity.</div>
      </div>
    )
  }

  if (!isTreasury) {
    return (
      <div className={styles.page}>
        <div className={styles.deniedCard}>
          <h1>Treasury Access Only</h1>
          <p>This page is restricted to the configured treasury wallet.</p>
          <p>Connected wallet: {truncateAddress(address, 8, 8)}</p>
          <p>Treasury wallet: {treasuryWallet ? truncateAddress(treasuryWallet, 8, 8) : 'Not configured'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.kicker}>Treasury Console</span>
        <h1>Manage the ARYA treasury and its ARYA/XLM liquidity position.</h1>
        <p>
          The treasury starts with 45,000,000 ARYA and seeds the initial AMM position with 500,000 ARYA and 5,000 XLM.
          This page is intentionally restricted to the treasury wallet.
        </p>
      </section>

      <div className={styles.container}>
        <section className={styles.heroMeta}>
          <span className={styles.metaLabel}>Liquidity Pool ID</span>
          <strong className={styles.metaValue}>{snapshot?.poolId || 'Loading...'}</strong>
        </section>

        <section className={styles.section}>
          <h2>Treasury Overview</h2>
          <div className={styles.metricGrid}>
            {treasuryStats.map(item => (
              <article key={item.label} className={styles.metricCard}>
                <span className={styles.metricLabel}>{item.label}</span>
                <strong className={styles.metricValue}>{item.value}</strong>
              </article>
            ))}
          </div>
          {snapshotError && <p className={styles.warning}>{snapshotError}</p>}
          {loading && <p className={styles.supporting}>Refreshing treasury balances and pool state...</p>}
        </section>

        <section className={styles.section}>
          <h2>ARYA/XLM Pool Status</h2>
          <div className={styles.metricGrid}>
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>Pool Exists</span>
              <strong className={styles.metricValue}>{snapshot?.poolExists ? 'Yes' : 'No'}</strong>
            </article>
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>Treasury Pool Ownership</span>
              <strong className={styles.metricValue}>{formatMaybeNumber(snapshot?.positionSharePercent, 4)}%</strong>
            </article>
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>Withdrawable XLM</span>
              <strong className={styles.metricValue}>{formatMaybeNumber(snapshot?.withdrawableXlm, 7)}</strong>
            </article>
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>Withdrawable ARYA</span>
              <strong className={styles.metricValue}>{formatMaybeNumber(snapshot?.withdrawableArya, 7)}</strong>
            </article>
          </div>

          <div className={styles.infoCard}>
            <p className={styles.infoLine}>Initial treasury liquidity target: 500,000 ARYA + 5,000 XLM.</p>
            <p className={styles.infoLine}>
              Estimated position change vs initial seed: {formatMaybeNumber(snapshot?.estimatedPositionChangeArya, 7)} ARYA and {formatMaybeNumber(snapshot?.estimatedPositionChangeXlm, 7)} XLM.
            </p>
            <p className={styles.supporting}>
              This shows the treasury&apos;s current withdrawable position relative to the initial seed. It is useful operationally, but it does not isolate trading fees from price movement and impermanent loss.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Add Liquidity</h2>
          <div className={styles.formGrid}>
            <label className={styles.inputGroup}>
              <span>ARYA Amount</span>
              <input value={aryaLiquidityAmount} onChange={e => setAryaLiquidityAmount(e.target.value)} className={styles.input} />
            </label>
            <label className={styles.inputGroup}>
              <span>XLM Amount</span>
              <input value={xlmLiquidityAmount} onChange={e => setXlmLiquidityAmount(e.target.value)} className={styles.input} />
            </label>
          </div>
          <button
            className={styles.actionButton}
            onClick={() => handleTreasuryAction(() => addAryaXlmLiquidity({
              treasuryAddress: address,
              aryaAmount: aryaLiquidityAmount,
              xlmAmount: xlmLiquidityAmount,
              signTransaction,
            }))}
            disabled={txStatus === 'pending'}
          >
            Add ARYA/XLM Liquidity
          </button>
        </section>

        <section className={styles.section}>
          <h2>Remove Liquidity</h2>
          <div className={styles.formGrid}>
            <label className={styles.inputGroup}>
              <span>Pool Share Amount</span>
              <input
                value={poolSharesAmount}
                onChange={e => setPoolSharesAmount(e.target.value)}
                className={styles.input}
                placeholder={snapshot?.treasuryPoolShareBalance || '0.0000000'}
              />
            </label>
          </div>
          <div className={styles.presetRow}>
            {REMOVE_LIQUIDITY_PRESETS.map(percent => (
              <button
                key={percent}
                type="button"
                className={styles.presetButton}
                onClick={() => applyRemoveLiquidityPreset(percent)}
                disabled={!canRemoveLiquidity || txStatus === 'pending'}
              >
                {percent}%
              </button>
            ))}
          </div>
          <button
            className={styles.secondaryButton}
            onClick={() => handleTreasuryAction(() => removeAryaXlmLiquidity({
              treasuryAddress: address,
              poolSharesAmount,
              signTransaction,
            }))}
            disabled={!poolSharesAmount || !canRemoveLiquidity || txStatus === 'pending'}
          >
            Remove Liquidity
          </button>
        </section>
      </div>

      {txStatus && (
        <TxStatus
          status={txStatus}
          hash={txHash}
          error={txError}
          onClose={() => {
            setTxStatus(null)
            setTxError(null)
          }}
        />
      )}
    </div>
  )
}
