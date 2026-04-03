import { useEffect, useState } from 'react'
import {
    useCampaigns,
    useLaunchpadSettings,
    usePlatformSettings,
    useRegistryConfig,
    useStakingOverview,
} from '../../hooks/useContract'
import { useWallet } from '../../hooks/useWallet'
import {
    fundTreasuryWithArya,
    getAssetTrustlineStatus,
    setRegistryContracts,
    setRegistryAryaToken,
    setRegistryTreasury,
    transferCrowdfundingOwnership,
    transferLaunchpadOwnership,
    transferRegistryOwnership,
    transferStakingOwnership,
    updateActionWindowDays,
    updateFeeSettings,
    updateLaunchpadFeeSettings,
    updateLaunchpadStakingContract,
    updateLaunchpadTreasuryWallet,
    updateMinLockupDays,
    updateStakeToken,
    updateStakingContract,
    updateTreasuryWallet,
} from '../../contract/client'
import { PLATFORM_OWNER } from '../../contract/config'
import StatusBadge from '../../components/StatusBadge/StatusBadge'
import TxStatus from '../../components/TxStatus/TxStatus'
import { basisPointsToPercent, stroopsToXlm } from '../../utils/format'
import { truncateAddress } from '../../utils/stellar'
import styles from './Admin.module.css'

const INITIAL_FORMS = {
    fee: '',
    share: '',
    crowdfundingTreasury: '',
    crowdfundingStaking: '',
    actionWindow: '',
    crowdfundingOwner: '',
    registryTreasury: '',
    registryAryaToken: '',
    registryStaking: '',
    registryCrowdfunding: '',
    registryLaunchpad: '',
    registryOwner: '',
    launchpadFee: '',
    launchpadShare: '',
    launchpadTreasury: '',
    launchpadStaking: '',
    launchpadOwner: '',
    stakeToken: '',
    minLockupDays: '',
    stakingOwner: '',
    aryaFundingAmount: '',
}

function isOwner(address, owner) {
    return Boolean(address && owner && address === owner)
}

function SettingCard({ label, value }) {
    return (
        <div className={styles.settingCard}>
            <span className={styles.settingLabel}>{label}</span>
            <span className={styles.settingValue}>{value}</span>
        </div>
    )
}

function ActionRow({
    label,
    value,
    onChange,
    buttonLabel,
    onSubmit,
    disabled,
    placeholder,
    type = 'text',
    danger = false,
}) {
    return (
        <div className={styles.formRow}>
            <div className={styles.inputGroup}>
                <label className={styles.label}>{label}</label>
                <input
                    className={styles.input}
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    onChange={onChange}
                />
            </div>
            <button
                className={danger ? `${styles.actionBtn} ${styles.dangerBtn}` : styles.actionBtn}
                onClick={onSubmit}
                disabled={disabled}
            >
                {buttonLabel}
            </button>
        </div>
    )
}

function AccessState({ variant, eyebrow, title, description, meta }) {
    const iconClass = variant === 'denied'
        ? `${styles.stateIcon} ${styles.stateIconDenied}`
        : `${styles.stateIcon} ${styles.stateIconConnect}`

    return (
        <div className={styles.page}>
            <div className={styles.stateShell}>
                <div className={styles.stateCard}>
                    <div className={iconClass} aria-hidden="true" />
                    <span className={styles.stateEyebrow}>{eyebrow}</span>
                    <h1 className={styles.stateTitle}>{title}</h1>
                    <p className={styles.stateText}>{description}</p>
                    {meta ? <div className={styles.stateMeta}>{meta}</div> : null}
                </div>
            </div>
        </div>
    )
}

export default function Admin() {
    const [address, setAddress] = useState(null)
    const [form, setForm] = useState(INITIAL_FORMS)
    const { getAddress, signTransaction } = useWallet()
    const { settings, loading: crowdfundingLoading, refresh: refreshCrowdfunding } = usePlatformSettings()
    const { config: registryConfig, loading: registryLoading, refresh: refreshRegistry } = useRegistryConfig()
    const { settings: launchpadSettings, loading: launchpadLoading, refresh: refreshLaunchpad } = useLaunchpadSettings()
    const { settings: stakingSettings, loading: stakingLoading, refresh: refreshStaking } = useStakingOverview()
    const { campaigns, loading: campaignsLoading } = useCampaigns()
    const [filter, setFilter] = useState('All')
    const [trustlineStatus, setTrustlineStatus] = useState(null)
    const [trustlineLoading, setTrustlineLoading] = useState(false)
    const [trustlineError, setTrustlineError] = useState(null)
    const [txState, setTxState] = useState({ status: null, hash: null, error: null })

    const setField = key => event => setForm(current => ({ ...current, [key]: event.target.value }))

    useEffect(() => {
        async function loadAddress() {
            setAddress(await getAddress())
        }

        loadAddress()
        const interval = setInterval(loadAddress, 2000)
        return () => clearInterval(interval)
    }, [getAddress])

    useEffect(() => {
        if (!settings) return
        setForm(current => ({
            ...current,
            fee: String(settings.fee_basis_points ?? ''),
            share: String(settings.staking_share_basis_points ?? ''),
            crowdfundingTreasury: settings.treasury_wallet ?? '',
            crowdfundingStaking: settings.staking_contract ?? '',
            actionWindow: String(settings.action_window_days ?? ''),
        }))
    }, [settings])

    useEffect(() => {
        if (!registryConfig) return
        setForm(current => ({
            ...current,
            registryTreasury: registryConfig.treasury ?? '',
            registryAryaToken: registryConfig.arya_token ?? '',
            registryStaking: registryConfig.staking_contract ?? '',
            registryCrowdfunding: registryConfig.crowdfunding_contract ?? '',
            registryLaunchpad: registryConfig.launchpad_contract ?? '',
        }))
    }, [registryConfig])

    useEffect(() => {
        if (!launchpadSettings) return
        setForm(current => ({
            ...current,
            launchpadFee: String(launchpadSettings.fee_basis_points ?? ''),
            launchpadShare: String(launchpadSettings.staking_share_basis_points ?? ''),
            launchpadTreasury: launchpadSettings.treasury_wallet ?? '',
            launchpadStaking: launchpadSettings.staking_contract ?? '',
        }))
    }, [launchpadSettings])

    useEffect(() => {
        if (!stakingSettings) return
        setForm(current => ({
            ...current,
            stakeToken: stakingSettings.stake_token ?? '',
            minLockupDays: String(stakingSettings.min_lockup_days ?? ''),
        }))
    }, [stakingSettings])

    const crowdfundingOwner = settings?.owner ?? ''
    const registryOwner = registryConfig?.owner ?? ''
    const launchpadOwner = launchpadSettings?.owner ?? ''
    const stakingOwner = stakingSettings?.owner ?? ''
    const isCrowdfundingOwner = isOwner(address, crowdfundingOwner)
    const isRegistryOwner = isOwner(address, registryOwner)
    const isLaunchpadOwner = isOwner(address, launchpadOwner)
    const isStakingOwner = isOwner(address, stakingOwner)
    const isIssuer = Boolean(address && PLATFORM_OWNER && address === PLATFORM_OWNER)
    const hasAdminAccess = isIssuer || isCrowdfundingOwner || isRegistryOwner || isLaunchpadOwner || isStakingOwner
    const treasuryWallet = registryConfig?.treasury || settings?.treasury_wallet || ''
    const canFundTreasury = Boolean(treasuryWallet && form.aryaFundingAmount && isIssuer && trustlineStatus?.hasTrustline)

    useEffect(() => {
        let cancelled = false

        async function loadTrustline() {
            if (!treasuryWallet) {
                setTrustlineStatus(null)
                setTrustlineError(null)
                return
            }
            setTrustlineLoading(true)
            setTrustlineError(null)
            try {
                const next = await getAssetTrustlineStatus(treasuryWallet)
                if (!cancelled) setTrustlineStatus(next)
            } catch (err) {
                if (!cancelled) {
                    setTrustlineStatus(null)
                    setTrustlineError(err.message)
                }
            } finally {
                if (!cancelled) setTrustlineLoading(false)
            }
        }

        loadTrustline()
        return () => {
            cancelled = true
        }
    }, [treasuryWallet])

    async function refreshTrustline() {
        if (!treasuryWallet) return
        setTrustlineLoading(true)
        try {
            setTrustlineStatus(await getAssetTrustlineStatus(treasuryWallet))
            setTrustlineError(null)
        } catch (err) {
            setTrustlineStatus(null)
            setTrustlineError(err.message)
        } finally {
            setTrustlineLoading(false)
        }
    }

    async function submitAction(action, onSuccess) {
        setTxState({ status: 'pending', hash: null, error: null })
        try {
            const result = await action()
            if (onSuccess) await onSuccess()
            setTxState({ status: 'success', hash: result.hash, error: null })
        } catch (err) {
            setTxState({ status: 'error', hash: null, error: err.message })
        }
    }

    const filteredCampaigns = campaigns.filter(campaign => {
        if (filter === 'All') return true
        return campaign.status.toLowerCase() === filter.toLowerCase()
    })

    if (!address) {
        return (
            <AccessState
                variant="connect"
                eyebrow="Admin Access"
                title="Connect your wallet"
                description="Connect the platform owner wallet to open admin controls for treasury, registry, launchpad, crowdfunding, and staking."
                meta={
                    <div className={styles.stateMetaRow}>
                        <span className={styles.stateMetaLabel}>Status</span>
                        <span className={styles.stateMetaValue}>Wallet not connected</span>
                    </div>
                }
            />
        )
    }

    if (!hasAdminAccess) {
        return (
            <AccessState
                variant="denied"
                eyebrow="Access Restricted"
                title="Admin permissions required"
                description="This wallet is connected, but it does not currently own any of the admin-controlled contracts used by the platform."
                meta={
                    <>
                        <div className={styles.stateMetaRow}>
                            <span className={styles.stateMetaLabel}>Connected wallet</span>
                            <span className={styles.stateMetaValue}>{truncateAddress(address, 8, 8)}</span>
                        </div>
                        <div className={styles.stateMetaRow}>
                            <span className={styles.stateMetaLabel}>Requirement</span>
                            <span className={styles.stateMetaValue}>Must match at least one contract owner</span>
                        </div>
                    </>
                }
            />
        )
    }

    /* if (!address && address === '__unused__') {
        return <div className={styles.page}><div className={styles.empty}><span className={styles.emptyIcon}>â—ˆ</span><p>Connect your wallet to access the admin panel</p></div></div>
    }

    if (!hasAdminAccess) {
        return <div className={styles.page}><div className={styles.denied}><span className={styles.deniedIcon}>âœ•</span><h2 className={styles.deniedTitle}>Access Denied</h2><p className={styles.deniedText}>This page is restricted to wallet addresses that own at least one admin-controlled contract.</p></div></div>
    }

    } */

    const loadingAny = crowdfundingLoading || registryLoading || launchpadLoading || stakingLoading

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Admin Panel</h1>
                    <div className={styles.ownerBadge}><div className={styles.ownerDot} /><span className={styles.ownerAddress}>{truncateAddress(address)}</span></div>
                </div>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Contract Owners</h2>
                    <div className={styles.settingsGrid}>
                        <SettingCard label="Crowdfunding" value={crowdfundingOwner ? truncateAddress(crowdfundingOwner, 8, 8) : 'Not loaded'} />
                        <SettingCard label="Registry" value={registryOwner ? truncateAddress(registryOwner, 8, 8) : 'Not loaded'} />
                        <SettingCard label="Launchpad" value={launchpadOwner ? truncateAddress(launchpadOwner, 8, 8) : 'Not loaded'} />
                        <SettingCard label="Staking" value={stakingOwner ? truncateAddress(stakingOwner, 8, 8) : 'Not loaded'} />
                    </div>
                    {loadingAny && <div className={styles.skeleton} />}
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Crowdfunding Admin</h2>
                    {settings && <div className={styles.settingsGrid}>
                        <SettingCard label="Fee" value={`${basisPointsToPercent(settings.fee_basis_points)}%`} />
                        <SettingCard label="Staking Share" value={`${basisPointsToPercent(settings.staking_share_basis_points)}%`} />
                        <SettingCard label="Action Window" value={`${settings.action_window_days} days`} />
                        <SettingCard label="Treasury" value={truncateAddress(settings.treasury_wallet, 8, 8)} />
                        <SettingCard label="Staking Contract" value={truncateAddress(settings.staking_contract, 8, 8)} />
                    </div>}
                    {!isCrowdfundingOwner && crowdfundingOwner && <p className={styles.warningText}>Connect {truncateAddress(crowdfundingOwner, 8, 8)} to submit crowdfunding admin transactions.</p>}
                    <div className={styles.formGrid}>
                        <div className={styles.formRow}>
                            <div className={styles.inputGroup}><label className={styles.label}>Fee (basis points)</label><input className={styles.input} type="number" value={form.fee} onChange={setField('fee')} /></div>
                            <div className={styles.inputGroup}><label className={styles.label}>Staking Share (basis points)</label><input className={styles.input} type="number" value={form.share} onChange={setField('share')} /></div>
                            <button className={styles.actionBtn} disabled={!isCrowdfundingOwner || !form.fee || !form.share || txState.status === 'pending'} onClick={() => submitAction(() => updateFeeSettings({ ownerAddress: address, newFee: parseInt(form.fee, 10), stakingShareBasisPoints: parseInt(form.share, 10), signTransaction }), refreshCrowdfunding)}>Update Fees</button>
                        </div>
                        <ActionRow label="Treasury Wallet" value={form.crowdfundingTreasury} onChange={setField('crowdfundingTreasury')} buttonLabel="Update Treasury" disabled={!isCrowdfundingOwner || !form.crowdfundingTreasury.trim() || txState.status === 'pending'} onSubmit={() => submitAction(() => updateTreasuryWallet({ ownerAddress: address, newWallet: form.crowdfundingTreasury.trim(), signTransaction }), async () => { await refreshCrowdfunding(); await refreshRegistry(); await refreshTrustline() })} />
                        <ActionRow label="Staking Contract" value={form.crowdfundingStaking} onChange={setField('crowdfundingStaking')} buttonLabel="Update Staking Contract" disabled={!isCrowdfundingOwner || !form.crowdfundingStaking.trim() || txState.status === 'pending'} onSubmit={() => submitAction(() => updateStakingContract({ ownerAddress: address, stakingContract: form.crowdfundingStaking.trim(), signTransaction }), refreshCrowdfunding)} />
                        <ActionRow label="Action Window (days)" value={form.actionWindow} onChange={setField('actionWindow')} buttonLabel="Update Action Window" type="number" disabled={!isCrowdfundingOwner || !form.actionWindow || txState.status === 'pending'} onSubmit={() => submitAction(() => updateActionWindowDays({ ownerAddress: address, actionWindowDays: parseInt(form.actionWindow, 10), signTransaction }), refreshCrowdfunding)} />
                        <ActionRow label="New Crowdfunding Owner" value={form.crowdfundingOwner} onChange={setField('crowdfundingOwner')} buttonLabel="Transfer Ownership" placeholder="G..." danger disabled={!isCrowdfundingOwner || !form.crowdfundingOwner.trim() || txState.status === 'pending'} onSubmit={() => submitAction(() => transferCrowdfundingOwnership({ ownerAddress: address, newOwner: form.crowdfundingOwner.trim(), signTransaction }), async () => { setForm(current => ({ ...current, crowdfundingOwner: '' })); await refreshCrowdfunding() })} />
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Registry Admin</h2>
                    {registryConfig && <div className={styles.settingsGrid}>
                        <SettingCard label="ARYA Token" value={truncateAddress(registryConfig.arya_token, 8, 8)} />
                        <SettingCard label="Treasury" value={truncateAddress(registryConfig.treasury, 8, 8)} />
                        <SettingCard label="Staking Contract" value={truncateAddress(registryConfig.staking_contract, 8, 8)} />
                        <SettingCard label="Crowdfunding Contract" value={truncateAddress(registryConfig.crowdfunding_contract, 8, 8)} />
                        <SettingCard label="Launchpad Contract" value={truncateAddress(registryConfig.launchpad_contract, 8, 8)} />
                    </div>}
                    {!isRegistryOwner && registryOwner && <p className={styles.warningText}>Connect {truncateAddress(registryOwner, 8, 8)} to submit registry admin transactions.</p>}
                    <div className={styles.formGrid}>
                        <ActionRow label="Registry ARYA Token" value={form.registryAryaToken} onChange={setField('registryAryaToken')} buttonLabel="Set ARYA Token" disabled={!isRegistryOwner || !form.registryAryaToken.trim() || txState.status === 'pending'} onSubmit={() => submitAction(() => setRegistryAryaToken({ ownerAddress: address, aryaToken: form.registryAryaToken.trim(), signTransaction }), refreshRegistry)} />
                        <ActionRow label="Registry Treasury" value={form.registryTreasury} onChange={setField('registryTreasury')} buttonLabel="Set Treasury" disabled={!isRegistryOwner || !form.registryTreasury.trim() || txState.status === 'pending'} onSubmit={() => submitAction(() => setRegistryTreasury({ ownerAddress: address, treasuryAddress: form.registryTreasury.trim(), signTransaction }), async () => { await refreshRegistry(); await refreshTrustline() })} />
                        <div className={styles.formRow}>
                            <div className={styles.inputGroup}><label className={styles.label}>Registry Staking Contract</label><input className={styles.input} type="text" value={form.registryStaking} onChange={setField('registryStaking')} /></div>
                            <div className={styles.inputGroup}><label className={styles.label}>Registry Crowdfunding Contract</label><input className={styles.input} type="text" value={form.registryCrowdfunding} onChange={setField('registryCrowdfunding')} /></div>
                            <div className={styles.inputGroup}><label className={styles.label}>Registry Launchpad Contract</label><input className={styles.input} type="text" value={form.registryLaunchpad} onChange={setField('registryLaunchpad')} /></div>
                            <button className={styles.actionBtn} disabled={!isRegistryOwner || !form.registryStaking.trim() || !form.registryCrowdfunding.trim() || !form.registryLaunchpad.trim() || txState.status === 'pending'} onClick={() => submitAction(() => setRegistryContracts({ ownerAddress: address, stakingContract: form.registryStaking.trim(), crowdfundingContract: form.registryCrowdfunding.trim(), launchpadContract: form.registryLaunchpad.trim(), signTransaction }), refreshRegistry)}>Set Contracts</button>
                        </div>
                        <ActionRow label="New Registry Owner" value={form.registryOwner} onChange={setField('registryOwner')} buttonLabel="Transfer Ownership" placeholder="G..." danger disabled={!isRegistryOwner || !form.registryOwner.trim() || txState.status === 'pending'} onSubmit={() => submitAction(() => transferRegistryOwnership({ ownerAddress: address, newOwner: form.registryOwner.trim(), signTransaction }), async () => { setForm(current => ({ ...current, registryOwner: '' })); await refreshRegistry() })} />
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Launchpad Admin</h2>
                    {launchpadSettings && <div className={styles.settingsGrid}>
                        <SettingCard label="Treasury" value={truncateAddress(launchpadSettings.treasury_wallet, 8, 8)} />
                        <SettingCard label="Staking Contract" value={truncateAddress(launchpadSettings.staking_contract, 8, 8)} />
                        <SettingCard label="Fee" value={`${basisPointsToPercent(launchpadSettings.fee_basis_points)}%`} />
                        <SettingCard label="Staking Share" value={`${basisPointsToPercent(launchpadSettings.staking_share_basis_points)}%`} />
                    </div>}
                    {!isLaunchpadOwner && launchpadOwner && <p className={styles.warningText}>Connect {truncateAddress(launchpadOwner, 8, 8)} to submit launchpad admin transactions.</p>}
                    <div className={styles.formGrid}>
                        <div className={styles.formRow}>
                            <div className={styles.inputGroup}><label className={styles.label}>Fee (basis points)</label><input className={styles.input} type="number" value={form.launchpadFee} onChange={setField('launchpadFee')} /></div>
                            <div className={styles.inputGroup}><label className={styles.label}>Staking Share (basis points)</label><input className={styles.input} type="number" value={form.launchpadShare} onChange={setField('launchpadShare')} /></div>
                            <button className={styles.actionBtn} disabled={!isLaunchpadOwner || !form.launchpadFee || !form.launchpadShare || txState.status === 'pending'} onClick={() => submitAction(() => updateLaunchpadFeeSettings({ ownerAddress: address, feeBasisPoints: parseInt(form.launchpadFee, 10), stakingShareBasisPoints: parseInt(form.launchpadShare, 10), signTransaction }), refreshLaunchpad)}>Update Fees</button>
                        </div>
                        <ActionRow label="Launchpad Treasury Wallet" value={form.launchpadTreasury} onChange={setField('launchpadTreasury')} buttonLabel="Update Treasury" disabled={!isLaunchpadOwner || !form.launchpadTreasury.trim() || txState.status === 'pending'} onSubmit={() => submitAction(() => updateLaunchpadTreasuryWallet({ ownerAddress: address, treasuryWallet: form.launchpadTreasury.trim(), signTransaction }), refreshLaunchpad)} />
                        <ActionRow label="Launchpad Staking Contract" value={form.launchpadStaking} onChange={setField('launchpadStaking')} buttonLabel="Update Staking Contract" disabled={!isLaunchpadOwner || !form.launchpadStaking.trim() || txState.status === 'pending'} onSubmit={() => submitAction(() => updateLaunchpadStakingContract({ ownerAddress: address, stakingContract: form.launchpadStaking.trim(), signTransaction }), refreshLaunchpad)} />
                        <ActionRow label="New Launchpad Owner" value={form.launchpadOwner} onChange={setField('launchpadOwner')} buttonLabel="Transfer Ownership" placeholder="G..." danger disabled={!isLaunchpadOwner || !form.launchpadOwner.trim() || txState.status === 'pending'} onSubmit={() => submitAction(() => transferLaunchpadOwnership({ ownerAddress: address, newOwner: form.launchpadOwner.trim(), signTransaction }), async () => { setForm(current => ({ ...current, launchpadOwner: '' })); await refreshLaunchpad() })} />
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Staking Admin</h2>
                    {stakingSettings && <div className={styles.settingsGrid}>
                        <SettingCard label="Stake Token" value={truncateAddress(stakingSettings.stake_token, 8, 8)} />
                        <SettingCard label="XLM Reward Token" value={truncateAddress(stakingSettings.xlm_reward_token, 8, 8)} />
                        <SettingCard label="Minimum Lockup" value={`${stakingSettings.min_lockup_days} days`} />
                    </div>}
                    {!isStakingOwner && stakingOwner && <p className={styles.warningText}>Connect {truncateAddress(stakingOwner, 8, 8)} to submit staking admin transactions.</p>}
                    <div className={styles.formGrid}>
                        <ActionRow label="Stake Token" value={form.stakeToken} onChange={setField('stakeToken')} buttonLabel="Update Stake Token" disabled={!isStakingOwner || !form.stakeToken.trim() || txState.status === 'pending'} onSubmit={() => submitAction(() => updateStakeToken({ ownerAddress: address, stakeToken: form.stakeToken.trim(), signTransaction }), refreshStaking)} />
                        <ActionRow label="Minimum Lockup (days)" value={form.minLockupDays} onChange={setField('minLockupDays')} buttonLabel="Update Lockup" type="number" disabled={!isStakingOwner || !form.minLockupDays || txState.status === 'pending'} onSubmit={() => submitAction(() => updateMinLockupDays({ ownerAddress: address, minLockupDays: parseInt(form.minLockupDays, 10), signTransaction }), refreshStaking)} />
                        <ActionRow label="New Staking Owner" value={form.stakingOwner} onChange={setField('stakingOwner')} buttonLabel="Transfer Ownership" placeholder="G..." danger disabled={!isStakingOwner || !form.stakingOwner.trim() || txState.status === 'pending'} onSubmit={() => submitAction(() => transferStakingOwnership({ ownerAddress: address, newOwner: form.stakingOwner.trim(), signTransaction }), async () => { setForm(current => ({ ...current, stakingOwner: '' })); await refreshStaking() })} />
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Fund Treasury With ARYA</h2>
                    <div className={styles.settingsGrid}>
                        <SettingCard label="Issuer Wallet" value={truncateAddress(PLATFORM_OWNER || address, 8, 8)} />
                        <SettingCard label="Treasury Wallet" value={treasuryWallet ? truncateAddress(treasuryWallet, 8, 8) : 'Not configured'} />
                        <SettingCard label="Treasury Trustline" value={trustlineLoading ? 'Checking...' : trustlineStatus?.hasTrustline ? 'Ready' : trustlineStatus?.accountExists ? 'Missing' : 'Account missing'} />
                    </div>
                    <div className={styles.trustlinePanel}>
                        <div className={styles.trustlineHeader}>
                            <strong>Treasury readiness</strong>
                            {trustlineStatus?.balance && <span className={styles.trustlineMeta}>Current ARYA balance: {trustlineStatus.balance}</span>}
                        </div>
                        {trustlineError ? <p className={styles.warningText}>{trustlineError}</p> : trustlineLoading ? <p className={styles.supportingText}>Checking whether the treasury wallet can receive ARYA...</p> : trustlineStatus?.hasTrustline ? <p className={styles.successText}>Treasury trustline is active and ready to receive ARYA.</p> : trustlineStatus?.accountExists ? <p className={styles.warningText}>Treasury wallet exists but has not added the ARYA trustline yet.</p> : <p className={styles.warningText}>Treasury wallet was not found on Stellar testnet. Fund it with XLM and add the ARYA trustline first.</p>}
                    </div>
                    <ActionRow label="Amount of ARYA to send" value={form.aryaFundingAmount} onChange={setField('aryaFundingAmount')} buttonLabel="Send ARYA to Treasury" placeholder="e.g. 1000" disabled={!canFundTreasury || txState.status === 'pending'} onSubmit={() => submitAction(() => fundTreasuryWithArya({ issuerAddress: address, treasuryAddress: treasuryWallet, amount: form.aryaFundingAmount, signTransaction }), async () => { setForm(current => ({ ...current, aryaFundingAmount: '' })); await refreshTrustline() })} />
                    {!isIssuer && <p className={styles.warningText}>Connect the issuer wallet {truncateAddress(PLATFORM_OWNER, 8, 8)} to send newly issued ARYA into the treasury.</p>}
                    <div className={styles.infoPanel}>
                        <h3 className={styles.infoTitle}>How to add ARYA to the treasury wallet</h3>
                        <ol className={styles.infoList}>
                            <li>Open the treasury wallet and make sure the account exists on Stellar testnet.</li>
                            <li>Add the custom asset with code <strong>ARYA</strong> and issuer <strong>{PLATFORM_OWNER}</strong>.</li>
                            <li>Return here once the trustline is active and fund the treasury from the issuer wallet.</li>
                        </ol>
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>All Campaigns</h2>
                        <div className={styles.filters}>
                            {['All', 'Active', 'Successful', 'Failed'].map(value => <button key={value} className={`${styles.filterBtn} ${filter === value ? styles.active : ''}`} onClick={() => setFilter(value)}>{value}</button>)}
                        </div>
                    </div>
                    {campaignsLoading ? <div className={styles.skeleton} /> : filteredCampaigns.length === 0 ? <div className={styles.empty}><p>No {filter !== 'All' ? filter.toLowerCase() : ''} campaigns found.</p></div> : <div className={styles.campaignList}>{filteredCampaigns.map(campaign => {
                        const displayStatus = Number(campaign.total_raised) >= Number(campaign.goal_amount) && campaign.status === 'Active' ? 'Goal Met' : campaign.status
                        return <div key={campaign.id} className={styles.campaignRow}><div className={styles.campaignInfo}><span className={styles.campaignId}>#{campaign.id}</span><span className={styles.campaignTitle}>{campaign.title}</span></div><div className={styles.campaignMeta}><span className={styles.campaignOrganizer}>{truncateAddress(campaign.organizer)}</span><span className={styles.campaignRaised}>{stroopsToXlm(campaign.total_raised)} XLM</span><StatusBadge status={displayStatus} /></div></div>
                    })}</div>}
                </section>

                {txState.status && <div className={styles.txWrapper}><TxStatus status={txState.status} hash={txState.hash} error={txState.error} onClose={() => setTxState({ status: null, hash: null, error: null })} /></div>}
            </div>
        </div>
    )
}
