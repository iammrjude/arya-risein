import { rpcServer } from './server'

export async function getLatestLedgerSequence() {
  const latest = await rpcServer.getLatestLedger()
  return latest.sequence
}

export async function getContractEvents({
  contractIds,
  cursor,
  startLedger,
  topics,
  limit = 50,
}) {
  if (!contractIds?.length) {
    return { events: [], cursor: cursor ?? null }
  }

  const filters = [
    {
      type: 'contract',
      contractIds,
      ...(topics ? { topics } : {}),
    },
  ]

  const request = cursor
    ? { filters, cursor, limit }
    : { filters, startLedger, limit }

  return rpcServer.getEvents(request)
}
