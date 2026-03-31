import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TxStatus from '../../components/TxStatus/TxStatus'
import { createCampaign } from '../../contract/client'
import { xlmToStroops, basisPointsToPercent, calcSuggestedGoal, assetCodeFromFundingAsset } from '../../utils/format'
import { toUnixTimestamp } from '../../utils/time'
import { usePlatformSettings } from '../../hooks/useContract'
import { useWallet } from '../../hooks/useWallet'
import styles from './Create.module.css'

const FUNDING_ASSETS = ['Xlm', 'Usdc']

const INITIAL_FORM = {
    title: '',
    description: '',
    goalAmount: '',
    deadline: '',
    extensionDays: '30',
    fundingAsset: 'Xlm',
}

export default function Create() {
    const navigate = useNavigate()
    const { settings } = usePlatformSettings()
    const { getAddress, signTransaction } = useWallet()
    const [form, setForm] = useState(INITIAL_FORM)
    const [errors, setErrors] = useState({})
    const [txStatus, setTxStatus] = useState(null)
    const [txHash, setTxHash] = useState(null)
    const [txError, setTxError] = useState(null)

    const fee = settings?.fee_basis_points ?? 250
    const suggestedGoal = calcSuggestedGoal(form.goalAmount, fee)
    const assetCode = assetCodeFromFundingAsset(form.fundingAsset)

    function handleChange(e) {
        const { name, value } = e.target
        setForm(f => ({ ...f, [name]: value }))
        setErrors(errs => ({ ...errs, [name]: null }))
    }

    function validate() {
        const errs = {}
        if (!form.title.trim()) errs.title = 'Title is required'
        if (!form.description.trim()) errs.description = 'Description is required'
        if (!form.goalAmount || parseFloat(form.goalAmount) <= 0) errs.goalAmount = 'Enter a valid goal amount'
        if (!form.deadline) errs.deadline = 'Deadline is required'
        else if (toUnixTimestamp(form.deadline) <= Math.floor(Date.now() / 1000)) {
            errs.deadline = 'Deadline must be in the future'
        }
        if (!form.extensionDays || parseInt(form.extensionDays) <= 0) {
            errs.extensionDays = 'Extension days must be a positive number'
        }
        return errs
    }

    async function handleSubmit() {
        const errs = validate()
        if (Object.keys(errs).length > 0) {
            setErrors(errs)
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
            const result = await createCampaign({
                organizerAddress: address,
                title: form.title.trim(),
                description: form.description.trim(),
                goalAmount: xlmToStroops(form.goalAmount),
                deadline: toUnixTimestamp(form.deadline),
                extensionDays: parseInt(form.extensionDays),
                fundingAsset: form.fundingAsset,
                signTransaction,
            })
            setTxStatus('success')
            setTxHash(result.hash)
            setTimeout(() => navigate('/crowdfunding'), 25000) // Redirect after 25 seconds to allow users to see the success message and Tx hash
        } catch (err) {
            setTxStatus('error')
            if (err.message?.includes('balance') || err.message?.includes('underfunded')) {
                setTxError('Insufficient XLM balance')
            } else if (err.message?.includes('rejected') || err.message?.includes('denied')) {
                setTxError('Transaction rejected')
            } else {
                setTxError(err.message || 'Failed to create campaign')
            }
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Create a Campaign</h1>
                    <p className={styles.subtitle}>
                        Launch a trustless crowdfunding campaign on the Stellar network with XLM or USDC funding.
                    </p>
                </div>

                {settings && (
                    <div className={styles.feeNotice}>
                        <span className={styles.feeIcon}>ℹ</span>
                        Platform fee is <strong>{basisPointsToPercent(fee)}%</strong> of total raised, deducted on successful withdrawal.
                        {form.goalAmount && (
                            <span className={styles.feeSuggestion}>
                                {' '}To receive ~{parseFloat(form.goalAmount).toLocaleString()} {assetCode}, consider setting your goal to{' '}
                                <strong>{parseFloat(suggestedGoal).toLocaleString()} {assetCode}</strong>.
                            </span>
                        )}
                    </div>
                )}

                <div className={styles.form}>
                    <div className={styles.field}>
                        <label className={styles.label}>Campaign Title</label>
                        <input
                            name="title"
                            type="text"
                            className={`${styles.input} ${errors.title ? styles.hasError : ''}`}
                            placeholder="Give your campaign a clear name"
                            value={form.title}
                            onChange={handleChange}
                            disabled={txStatus === 'pending'}
                        />
                        {errors.title && <span className={styles.fieldError}>{errors.title}</span>}
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Description</label>
                        <textarea
                            name="description"
                            className={`${styles.textarea} ${errors.description ? styles.hasError : ''}`}
                            placeholder="Describe your campaign in detail. What are you raising funds for? How will they be used?"
                            value={form.description}
                            onChange={handleChange}
                            disabled={txStatus === 'pending'}
                            rows={5}
                        />
                        {errors.description && <span className={styles.fieldError}>{errors.description}</span>}
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>Funding Asset</label>
                            <div className={styles.inputWrap}>
                                <select
                                    name="fundingAsset"
                                    className={styles.input}
                                    value={form.fundingAsset}
                                    onChange={handleChange}
                                    disabled={txStatus === 'pending'}
                                >
                                    {FUNDING_ASSETS.map(asset => (
                                        <option key={asset} value={asset}>
                                            {assetCodeFromFundingAsset(asset)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Goal Amount</label>
                            <div className={styles.inputWrap}>
                                <input
                                    name="goalAmount"
                                    type="number"
                                    className={`${styles.input} ${errors.goalAmount ? styles.hasError : ''}`}
                                    placeholder="0.00"
                                    value={form.goalAmount}
                                    onChange={handleChange}
                                    disabled={txStatus === 'pending'}
                                    min="0"
                                    step="any"
                                />
                                <span className={styles.inputSuffix}>{assetCode}</span>
                            </div>
                            {errors.goalAmount && <span className={styles.fieldError}>{errors.goalAmount}</span>}
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Extension Days
                                <span className={styles.labelNote}>(if goal not met, one-time extension)</span>
                            </label>
                            <div className={styles.inputWrap}>
                                <input
                                    name="extensionDays"
                                    type="number"
                                    className={`${styles.input} ${errors.extensionDays ? styles.hasError : ''}`}
                                    placeholder="30"
                                    value={form.extensionDays}
                                    onChange={handleChange}
                                    disabled={txStatus === 'pending'}
                                    min="1"
                                />
                                <span className={styles.inputSuffix}>days</span>
                            </div>
                            {errors.extensionDays && <span className={styles.fieldError}>{errors.extensionDays}</span>}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Campaign Deadline</label>
                        <input
                            name="deadline"
                            type="datetime-local"
                            className={`${styles.input} ${errors.deadline ? styles.hasError : ''}`}
                            value={form.deadline}
                            onChange={handleChange}
                            disabled={txStatus === 'pending'}
                        />
                        {errors.deadline && <span className={styles.fieldError}>{errors.deadline}</span>}
                    </div>

                    {txStatus && (
                        <TxStatus
                            status={txStatus}
                            hash={txHash}
                            error={txError}
                            onClose={() => { setTxStatus(null); setTxError(null) }}
                        />
                    )}

                    {txStatus === 'success' && (
                        <p className={styles.successNote}>
                            Campaign created! Redirecting to browse page...
                        </p>
                    )}

                    <button
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={txStatus === 'pending' || txStatus === 'success'}
                    >
                        {txStatus === 'pending' ? (
                            <><span className={styles.spinner} /> Creating Campaign...</>
                        ) : (
                            'Launch Campaign →'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
