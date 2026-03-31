import { useState, useEffect, useCallback } from 'react'
import {
    getCampaigns,
    getCampaign,
    getPlatformSettings,
    getRegistryConfig,
    getSale,
    getSales,
    getLaunchpadSettings,
    getStakingPool,
    getStakingPosition,
    getStakingSettings,
    getTotalStaked,
} from '../contract/client'
import { useEventStream } from './useEventStream'
import {
    CROWDFUNDING_CONTRACT_ID,
    LAUNCHPAD_CONTRACT_ID,
    REGISTRY_CONTRACT_ID,
    STAKING_CONTRACT_ID,
} from '../contract/config'

export function useCampaigns() {
    const [campaigns, setCampaigns] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refresh = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            setCampaigns(await getCampaigns())
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void refresh()
    }, [refresh])

    useEventStream({
        contractIds: CROWDFUNDING_CONTRACT_ID ? [CROWDFUNDING_CONTRACT_ID] : [],
        onEvents: refresh,
    })

    return { campaigns, loading, error, refresh }
}

export function useCampaign(campaignId) {
    const [campaign, setCampaign] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refresh = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            if (campaignId === undefined || campaignId === null) {
                setCampaign(null)
            } else {
                setCampaign(await getCampaign(Number(campaignId)))
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [campaignId])

    useEffect(() => {
        void refresh()
    }, [refresh])

    useEventStream({
        contractIds: CROWDFUNDING_CONTRACT_ID ? [CROWDFUNDING_CONTRACT_ID] : [],
        onEvents: refresh,
    })

    return { campaign, loading, error, refresh }
}

export function usePlatformSettings() {
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refresh = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            setSettings(await getPlatformSettings())
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void refresh()
    }, [refresh])

    useEventStream({
        contractIds: CROWDFUNDING_CONTRACT_ID ? [CROWDFUNDING_CONTRACT_ID] : [],
        onEvents: refresh,
    })

    return { settings, loading, error, refresh }
}

export function useRegistryConfig() {
    const [config, setConfig] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refresh = useCallback(async () => {
        if (!REGISTRY_CONTRACT_ID) {
            setConfig(null)
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            setConfig(await getRegistryConfig())
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void refresh()
    }, [refresh])

    useEventStream({
        contractIds: REGISTRY_CONTRACT_ID ? [REGISTRY_CONTRACT_ID] : [],
        onEvents: refresh,
    })

    return { config, loading, error, refresh }
}

export function useSales() {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refresh = useCallback(async () => {
        if (!LAUNCHPAD_CONTRACT_ID) {
            setSales([])
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            setSales(await getSales())
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void refresh()
    }, [refresh])

    useEventStream({
        contractIds: LAUNCHPAD_CONTRACT_ID ? [LAUNCHPAD_CONTRACT_ID] : [],
        onEvents: refresh,
    })

    return { sales, loading, error, refresh }
}

export function useSale(saleId) {
    const [sale, setSale] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refresh = useCallback(async () => {
        if (!LAUNCHPAD_CONTRACT_ID) {
            setSale(null)
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            if (saleId === undefined || saleId === null) {
                setSale(null)
            } else {
                setSale(await getSale(Number(saleId)))
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [saleId])

    useEffect(() => {
        void refresh()
    }, [refresh])

    useEventStream({
        contractIds: LAUNCHPAD_CONTRACT_ID ? [LAUNCHPAD_CONTRACT_ID] : [],
        onEvents: refresh,
    })

    return { sale, loading, error, refresh }
}

export function useLaunchpadSettings() {
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refresh = useCallback(async () => {
        if (!LAUNCHPAD_CONTRACT_ID) {
            setSettings(null)
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            setSettings(await getLaunchpadSettings())
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void refresh()
    }, [refresh])

    useEventStream({
        contractIds: LAUNCHPAD_CONTRACT_ID ? [LAUNCHPAD_CONTRACT_ID] : [],
        onEvents: refresh,
    })

    return { settings, loading, error, refresh }
}

export function useStakingOverview() {
    const [settings, setSettings] = useState(null)
    const [totalStaked, setTotalStaked] = useState(null)
    const [pools, setPools] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refresh = useCallback(async () => {
        if (!STAKING_CONTRACT_ID) {
            setSettings(null)
            setTotalStaked(null)
            setPools(null)
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const [nextSettings, nextTotalStaked, xlmPool, usdcPool] = await Promise.all([
                getStakingSettings(),
                getTotalStaked(),
                getStakingPool('Xlm'),
                getStakingPool('Usdc'),
            ])
            setSettings(nextSettings)
            setTotalStaked(nextTotalStaked)
            setPools({ Xlm: xlmPool, Usdc: usdcPool })
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void refresh()
    }, [refresh])

    useEventStream({
        contractIds: STAKING_CONTRACT_ID ? [STAKING_CONTRACT_ID] : [],
        onEvents: refresh,
    })

    return { settings, totalStaked, pools, loading, error, refresh }
}

export function useStakingPosition(stakerAddress) {
    const [position, setPosition] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refresh = useCallback(async () => {
        if (!STAKING_CONTRACT_ID || !stakerAddress) {
            setPosition(null)
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            setPosition(await getStakingPosition(stakerAddress))
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [stakerAddress])

    useEffect(() => {
        void refresh()
    }, [refresh])

    useEventStream({
        contractIds: STAKING_CONTRACT_ID ? [STAKING_CONTRACT_ID] : [],
        onEvents: refresh,
    })

    return { position, loading, error, refresh }
}
