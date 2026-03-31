import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TxStatus from '../../../components/TxStatus/TxStatus'
import { createSale } from '../../../contract/client'
import { useWallet } from '../../../hooks/useWallet'
import { assetCodeFromFundingAsset, xlmToStroops } from '../../../utils/format'
import { toUnixTimestamp } from '../../../utils/time'
import styles from './LaunchpadPages.module.css'

const INITIAL_FORM = {
  saleToken: '',
  tokenPrice: '',
  tokenSupply: '',
  softCap: '',
  hardCap: '',
  startTime: '',
  endTime: '',
  fundingAsset: 'Xlm',
}

export default function LaunchpadCreatePage() {
  const navigate = useNavigate()
  const { getAddress, signTransaction } = useWallet()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [txStatus, setTxStatus] = useState(null)
  const [txHash, setTxHash] = useState(null)
  const [txError, setTxError] = useState(null)

  const assetCode = assetCodeFromFundingAsset(form.fundingAsset)

  function handleChange(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: null }))
  }

  function validate() {
    const next = {}
    if (!form.saleToken.trim()) next.saleToken = 'Sale token contract ID is required'
    if (!form.tokenPrice || parseFloat(form.tokenPrice) <= 0) next.tokenPrice = 'Token price must be positive'
    if (!form.tokenSupply || parseFloat(form.tokenSupply) <= 0) next.tokenSupply = 'Token supply must be positive'
    if (!form.softCap || parseFloat(form.softCap) <= 0) next.softCap = 'Soft cap must be positive'
    if (!form.hardCap || parseFloat(form.hardCap) <= 0) next.hardCap = 'Hard cap must be positive'
    if (parseFloat(form.softCap || 0) > parseFloat(form.hardCap || 0)) {
      next.hardCap = 'Hard cap must be greater than or equal to soft cap'
    }
    if (!form.startTime) next.startTime = 'Start time is required'
    if (!form.endTime) next.endTime = 'End time is required'
    if (form.startTime && form.endTime && toUnixTimestamp(form.startTime) >= toUnixTimestamp(form.endTime)) {
      next.endTime = 'End time must be after start time'
    }
    return next
  }

  async function handleSubmit() {
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const address = await getAddress()
    if (!address) {
      setTxStatus('error')
      setTxError('Please connect your wallet first')
      return
    }

    setTxStatus('pending')
    setTxHash(null)
    setTxError(null)

    try {
      const result = await createSale({
        ownerAddress: address,
        saleToken: form.saleToken.trim(),
        tokenPrice: xlmToStroops(form.tokenPrice),
        tokenSupply: xlmToStroops(form.tokenSupply),
        softCap: xlmToStroops(form.softCap),
        hardCap: xlmToStroops(form.hardCap),
        startTime: toUnixTimestamp(form.startTime),
        endTime: toUnixTimestamp(form.endTime),
        fundingAsset: form.fundingAsset,
        signTransaction,
      })

      setTxStatus('success')
      setTxHash(result.hash)
      setTimeout(() => navigate('/launchpad/dashboard'), 4000)
    } catch (error) {
      setTxStatus('error')
      setTxError(error.message || 'Failed to create sale')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.kicker}>Launchpad Creator</p>
          <h1 className={styles.title}>Create a launchpad sale</h1>
          <p className={styles.subtitle}>
            Preload token inventory, choose the funding asset, and open a sale window with soft and hard cap
            protections.
          </p>
        </div>

        <div className={styles.formCard}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Sale Token Contract</span>
              <input
                className={styles.input}
                name="saleToken"
                value={form.saleToken}
                onChange={handleChange}
                placeholder="C..."
              />
              {errors.saleToken && <span className={styles.fieldError}>{errors.saleToken}</span>}
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Funding Asset</span>
              <select className={styles.input} name="fundingAsset" value={form.fundingAsset} onChange={handleChange}>
                <option value="Xlm">XLM</option>
                <option value="Usdc">USDC</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Token Price ({assetCode})</span>
              <input className={styles.input} name="tokenPrice" value={form.tokenPrice} onChange={handleChange} type="number" min="0" step="any" />
              {errors.tokenPrice && <span className={styles.fieldError}>{errors.tokenPrice}</span>}
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Token Supply</span>
              <input className={styles.input} name="tokenSupply" value={form.tokenSupply} onChange={handleChange} type="number" min="0" step="any" />
              {errors.tokenSupply && <span className={styles.fieldError}>{errors.tokenSupply}</span>}
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Soft Cap ({assetCode})</span>
              <input className={styles.input} name="softCap" value={form.softCap} onChange={handleChange} type="number" min="0" step="any" />
              {errors.softCap && <span className={styles.fieldError}>{errors.softCap}</span>}
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Hard Cap ({assetCode})</span>
              <input className={styles.input} name="hardCap" value={form.hardCap} onChange={handleChange} type="number" min="0" step="any" />
              {errors.hardCap && <span className={styles.fieldError}>{errors.hardCap}</span>}
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Start Time</span>
              <input className={styles.input} name="startTime" value={form.startTime} onChange={handleChange} type="datetime-local" />
              {errors.startTime && <span className={styles.fieldError}>{errors.startTime}</span>}
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>End Time</span>
              <input className={styles.input} name="endTime" value={form.endTime} onChange={handleChange} type="datetime-local" />
              {errors.endTime && <span className={styles.fieldError}>{errors.endTime}</span>}
            </label>
          </div>

          {txStatus && (
            <div className={styles.txBlock}>
              <TxStatus status={txStatus} hash={txHash} error={txError} onClose={() => setTxStatus(null)} />
            </div>
          )}

          <button className={styles.primaryAction} onClick={handleSubmit} disabled={txStatus === 'pending'}>
            {txStatus === 'pending' ? 'Creating Sale...' : 'Create Sale'}
          </button>
        </div>
      </div>
    </div>
  )
}
