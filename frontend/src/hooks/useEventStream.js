import { useEffect, useRef } from 'react'
import { getContractEvents, getLatestLedgerSequence } from '../contract/events'

export function useEventStream({ contractIds, enabled = true, onEvents, pollMs = 5000 }) {
  const cursorRef = useRef(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!enabled || !contractIds?.length || typeof onEvents !== 'function') return undefined

    let cancelled = false

    async function primeCursor() {
      if (startedRef.current) return
      const latestLedger = await getLatestLedgerSequence()
      cursorRef.current = null
      startedRef.current = true

      if (!cancelled) {
        await pullEvents(Math.max(1, latestLedger - 10))
      }
    }

    async function pullEvents(startLedgerFallback = 1) {
      try {
        const response = await getContractEvents({
          contractIds,
          cursor: cursorRef.current,
          startLedger: cursorRef.current ? undefined : startLedgerFallback,
        })

        cursorRef.current = response.cursor
        if (response.events?.length) {
          onEvents(response.events)
        }
      } catch (error) {
        console.error('Event stream failed', error)
      }
    }

    primeCursor()
    const interval = setInterval(() => {
      pullEvents()
    }, pollMs)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [contractIds, enabled, onEvents, pollMs])
}
