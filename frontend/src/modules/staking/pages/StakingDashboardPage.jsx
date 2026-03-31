import { useEffect, useState } from 'react'
import TxStatus from '../../../components/TxStatus/TxStatus'
import {
  claimStakingRewards,
  stakeArya,
  unstakeArya,
} from '../../../contract/client'
import { useStakingOverview, useStakingPosition } from '../../../hooks/useContract'
import { useWallet } from '../../../hooks/useWallet'
import { formatAmountForFundingAsset, xlmToStroops } from '../../../utils/format'
import { formatDate } from '../../../utils/time'
import styles from './StakingPages.module.css'

export default function StakingDashboardPage() {
  const { getAddress, signTransaction } = useWallet()
  const [address, setAddress] = useState(null)
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [lockupDays, setLockupDays] = useState('7')
  const [txStatus, setTxStatus] = useState(null)
  const [txHash, setTxHash] = useState(null)
  const [txError, setTxError] = useState(null)

  const { settings, refresh: refreshOverview } = useStakingOverview()
  const { position, loading, refresh: refreshPosition } = useStakingPosition(address)

  useEffect(() => {
    async function loadAddress() {
      setAddress(await getAddress())
    }
    loadAddress()
  }, [getAddress])

  async function handleTx(action) {
    if (!address) {
      setTxStatus('error')
      setTxError('Please connect your wallet first')
      return
    }
    setTxStatus('pending')
    setTxHash(null)
    setTxError(null)
    try {
      const result = await action()
      setTxStatus('success')
      setTxHash(result.hash)
      setStakeAmount('')
      setUnstakeAmount('')
      refreshOverview()
      refreshPosition()
    } catch (error) {
      setTxStatus('error')
      setTxError(error.message || 'Transaction failed')
    }
  }

  const lockDate = position?.lock_until ? formatDate(position.lock_until) : 'Not locked'

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.poolCard}>
          <p className={styles.kicker}>My Positions</p>
          <h1 className={styles.title}>Staking dashboard</h1>
          <p className={styles.subtitle}>
            Stake ARYA, monitor pending rewards, and manage unlock timing from your connected wallet.
          </p>

          {!address && <div className={styles.notice}>Connect your wallet to manage staking positions.</div>}

          <div className={styles.grid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Staked Amount</span>
              <strong className={styles.metricValue}>{loading || !position ? '...' : position.staked_amount.toString()}</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Pending XLM</span>
              <strong className={styles.metricValue}>{loading || !position ? '...' : formatAmountForFundingAsset(position.pending_xlm, 'Xlm')}</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Pending USDC</span>
              <strong className={styles.metricValue}>{loading || !position ? '...' : formatAmountForFundingAsset(position.pending_usdc, 'Usdc')}</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Lock Until</span>
              <strong className={styles.metricValue}>{loading ? '...' : lockDate}</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Stake Token</span>
              <strong className={styles.metricValue}>{settings?.stake_token || 'Not configured'}</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Minimum Lockup</span>
              <strong className={styles.metricValue}>{settings ? `${settings.min_lockup_days} days` : '...'}</strong>
            </div>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Stake Amount (ARYA token units)</span>
              <input className={styles.input} value={stakeAmount} onChange={event => setStakeAmount(event.target.value)} type="number" min="0" step="any" />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Lockup Days</span>
              <input className={styles.input} value={lockupDays} onChange={event => setLockupDays(event.target.value)} type="number" min={settings?.min_lockup_days || 1} />
            </label>

            <button
              className={styles.primaryAction}
              disabled={!stakeAmount || txStatus === 'pending'}
              onClick={() => handleTx(() => stakeArya({
                stakerAddress: address,
                amount: xlmToStroops(stakeAmount),
                lockupDays: Number(lockupDays),
                signTransaction,
              }))}
            >
              Stake ARYA
            </button>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Unstake Amount (ARYA token units)</span>
              <input className={styles.input} value={unstakeAmount} onChange={event => setUnstakeAmount(event.target.value)} type="number" min="0" step="any" />
            </label>

            <button
              className={styles.secondaryAction}
              disabled={!unstakeAmount || txStatus === 'pending'}
              onClick={() => handleTx(() => unstakeArya({
                stakerAddress: address,
                amount: xlmToStroops(unstakeAmount),
                signTransaction,
              }))}
            >
              Unstake ARYA
            </button>

            <button
              className={styles.secondaryAction}
              disabled={txStatus === 'pending'}
              onClick={() => handleTx(() => claimStakingRewards({
                stakerAddress: address,
                signTransaction,
              }))}
            >
              Claim Rewards
            </button>
          </div>

          {txStatus && (
            <div className={styles.txBlock}>
              <TxStatus status={txStatus} hash={txHash} error={txError} onClose={() => setTxStatus(null)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
