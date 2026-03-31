import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import StatusBadge from '../../../components/StatusBadge/StatusBadge'
import TxStatus from '../../../components/TxStatus/TxStatus'
import {
  claimLaunchpadRefund,
  claimLaunchpadTokens,
  contributeToSale,
  getContribution,
  reclaimUnsoldTokens,
  withdrawSaleFunds,
} from '../../../contract/client'
import { useSale } from '../../../hooks/useContract'
import { useWallet } from '../../../hooks/useWallet'
import { assetCodeFromFundingAsset, formatAmountForFundingAsset, xlmToStroops } from '../../../utils/format'
import { formatDate } from '../../../utils/time'
import styles from './LaunchpadPages.module.css'

function getDisplayStatus(sale) {
  const now = Math.floor(Date.now() / 1000)
  if (sale.status !== 'Active') return sale.status
  if (now < Number(sale.start_time)) return 'Scheduled'
  if (now > Number(sale.end_time)) {
    return Number(sale.total_raised) >= Number(sale.soft_cap) ? 'Awaiting Settlement' : 'Refund Window'
  }
  return 'Live'
}

export default function LaunchpadProjectPage() {
  const { id } = useParams()
  const { sale, loading, error, refresh } = useSale(Number(id))
  const { getAddress, signTransaction } = useWallet()
  const [walletAddress, setWalletAddress] = useState(null)
  const [contribution, setContribution] = useState(null)
  const [amount, setAmount] = useState('')
  const [txStatus, setTxStatus] = useState(null)
  const [txHash, setTxHash] = useState(null)
  const [txError, setTxError] = useState(null)

  useEffect(() => {
    async function loadAddress() {
      const address = await getAddress()
      setWalletAddress(address)
    }
    loadAddress()
  }, [getAddress])

  useEffect(() => {
    async function loadContribution() {
      if (!sale || !walletAddress) {
        setContribution(null)
        return
      }
      try {
        const next = await getContribution(Number(id), walletAddress)
        setContribution(next)
      } catch {
        setContribution(null)
      }
    }
    loadContribution()
  }, [sale, walletAddress, id])

  const fundingAsset = sale ? assetCodeFromFundingAsset(sale.funding_asset) : ''
  const now = Math.floor(Date.now() / 1000)
  const displayStatus = sale ? getDisplayStatus(sale) : ''
  const saleOpen = sale && now >= Number(sale.start_time) && now <= Number(sale.end_time) && sale.status === 'Active'
  const ended = sale && now > Number(sale.end_time)
  const saleSucceeded = sale && ended && Number(sale.total_raised) >= Number(sale.soft_cap)
  const saleFailed = sale && ended && Number(sale.total_raised) < Number(sale.soft_cap)
  const isOwner = sale && walletAddress === sale.project_owner
  const tokenAmountFromContribution = useMemo(() => {
    if (!sale || !contribution) return null
    return BigInt(contribution) / BigInt(sale.token_price)
  }, [sale, contribution])

  async function handleTx(action) {
    if (!walletAddress) {
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
      setAmount('')
      refresh()
      const nextContribution = await getContribution(Number(id), walletAddress)
      setContribution(nextContribution)
    } catch (txErrorValue) {
      setTxStatus('error')
      setTxError(txErrorValue.message || 'Transaction failed')
    }
  }

  if (loading) {
    return <div className={styles.page}><div className={styles.container}><div className={styles.card}>Loading sale...</div></div></div>
  }

  if (error || !sale) {
    return <div className={styles.page}><div className={styles.container}><div className={styles.errorBox}>Sale not found: {error}</div></div></div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.rowBetween}>
          <div className={styles.header}>
            <p className={styles.kicker}>Launchpad Project</p>
            <h1 className={styles.title}>Sale #{sale.id}</h1>
            <p className={styles.subtitle}>
              Funding asset: {fundingAsset}. Sale token: {sale.sale_token}
            </p>
          </div>
          <StatusBadge status={displayStatus} />
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Sale Metrics</h2>
            <div className={styles.metricGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Raised</span>
                <strong className={styles.metricValue}>{formatAmountForFundingAsset(sale.total_raised, sale.funding_asset)}</strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Soft Cap</span>
                <strong className={styles.metricValue}>{formatAmountForFundingAsset(sale.soft_cap, sale.funding_asset)}</strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Hard Cap</span>
                <strong className={styles.metricValue}>{formatAmountForFundingAsset(sale.hard_cap, sale.funding_asset)}</strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Token Price</span>
                <strong className={styles.metricValue}>{formatAmountForFundingAsset(sale.token_price, sale.funding_asset)}</strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Start</span>
                <strong className={styles.metricValue}>{formatDate(sale.start_time)}</strong>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>End</span>
                <strong className={styles.metricValue}>{formatDate(sale.end_time)}</strong>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Your Participation</h2>
            <p className={styles.cardText}>
              Connected wallet: {walletAddress || 'Not connected'}
            </p>
            <p className={styles.cardText}>
              Current contribution: {contribution ? formatAmountForFundingAsset(contribution, sale.funding_asset) : `0 ${fundingAsset}`}
            </p>
            {tokenAmountFromContribution !== null && (
              <p className={styles.cardText}>Claimable token amount: {tokenAmountFromContribution.toString()}</p>
            )}

            {saleOpen && (
              <div className={styles.formStack}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Contribution Amount ({fundingAsset})</span>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={event => setAmount(event.target.value)}
                  />
                </label>
                <button
                  className={styles.primaryAction}
                  disabled={!amount || txStatus === 'pending'}
                  onClick={() => handleTx(() => contributeToSale({
                    buyerAddress: walletAddress,
                    saleId: Number(id),
                    amount: xlmToStroops(amount),
                    signTransaction,
                  }))}
                >
                  {txStatus === 'pending' ? 'Submitting...' : `Contribute ${fundingAsset}`}
                </button>
              </div>
            )}

            {saleSucceeded && (
              <div className={styles.actionList}>
                <button
                  className={styles.primaryAction}
                  disabled={txStatus === 'pending' || !contribution || BigInt(contribution) <= 0n}
                  onClick={() => handleTx(() => claimLaunchpadTokens({
                    buyerAddress: walletAddress,
                    saleId: Number(id),
                    signTransaction,
                  }))}
                >
                  Claim Tokens
                </button>
                {isOwner && (
                  <>
                    <button
                      className={styles.secondaryAction}
                      disabled={txStatus === 'pending'}
                      onClick={() => handleTx(() => withdrawSaleFunds({
                        ownerAddress: walletAddress,
                        saleId: Number(id),
                        signTransaction,
                      }))}
                    >
                      Withdraw Sale Funds
                    </button>
                    <button
                      className={styles.secondaryAction}
                      disabled={txStatus === 'pending'}
                      onClick={() => handleTx(() => reclaimUnsoldTokens({
                        ownerAddress: walletAddress,
                        saleId: Number(id),
                        signTransaction,
                      }))}
                    >
                      Reclaim Unsold Tokens
                    </button>
                  </>
                )}
              </div>
            )}

            {saleFailed && (
              <div className={styles.actionList}>
                <button
                  className={styles.primaryAction}
                  disabled={txStatus === 'pending' || !contribution || BigInt(contribution) <= 0n}
                  onClick={() => handleTx(() => claimLaunchpadRefund({
                    buyerAddress: walletAddress,
                    saleId: Number(id),
                    signTransaction,
                  }))}
                >
                  Claim Refund
                </button>
                {isOwner && (
                  <button
                    className={styles.secondaryAction}
                    disabled={txStatus === 'pending'}
                    onClick={() => handleTx(() => reclaimUnsoldTokens({
                      ownerAddress: walletAddress,
                      saleId: Number(id),
                      signTransaction,
                    }))}
                  >
                    Reclaim Unsold Tokens
                  </button>
                )}
              </div>
            )}

            {txStatus && (
              <div className={styles.txBlock}>
                <TxStatus status={txStatus} hash={txHash} error={txError} onClose={() => setTxStatus(null)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
