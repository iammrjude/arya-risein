function postError(payload) {
  const endpoint = import.meta.env.VITE_ERROR_TRACKING_ENDPOINT
  if (!endpoint) return

  const body = JSON.stringify(payload)
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, body)
    return
  }

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}

export function reportError(error, context = {}) {
  postError({
    message: error?.message || 'Unknown error',
    stack: error?.stack || null,
    context,
    pathname: window.location.pathname,
    userAgent: navigator.userAgent,
    at: new Date().toISOString(),
  })
}

export function initMonitoring() {
  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message), { type: 'window-error' })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    reportError(reason, { type: 'unhandledrejection' })
  })
}
