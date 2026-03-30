import { useState, useEffect, useCallback } from 'react'
import { getCampaigns, getCampaign, getPlatformSettings } from '../contract/client'
import { useEventStream } from './useEventStream'
import { CONTRACT_ID } from '../contract/config'

export function useCampaigns() {
    const [campaigns, setCampaigns] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetch = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await getCampaigns()
            setCampaigns(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetch()
    }, [fetch])

    useEventStream({
        contractIds: CONTRACT_ID ? [CONTRACT_ID] : [],
        onEvents: () => {
            fetch()
        },
    })

    return { campaigns, loading, error, refresh: fetch }
}

export function useCampaign(campaignId) {
    const [campaign, setCampaign] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetch = useCallback(async () => {
        if (campaignId === undefined || campaignId === null) return
        setLoading(true)
        setError(null)
        try {
            const data = await getCampaign(Number(campaignId))
            setCampaign(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [campaignId])

    useEffect(() => {
        fetch()
    }, [fetch])

    useEventStream({
        contractIds: CONTRACT_ID ? [CONTRACT_ID] : [],
        onEvents: () => {
            fetch()
        },
    })

    return { campaign, loading, error, refresh: fetch }
}

export function usePlatformSettings() {
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetch() {
            try {
                const data = await getPlatformSettings()
                setSettings(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [])

    return { settings, loading, error }
}
