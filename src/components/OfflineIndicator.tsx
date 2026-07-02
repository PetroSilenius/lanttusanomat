'use client'

import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot() {
  return navigator.onLine
}

// During SSR/prerender assume online so no banner is baked into the HTML.
function getServerSnapshot() {
  return true
}

/** Fixed banner shown whenever the browser reports no network connection. */
export function OfflineIndicator() {
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  if (online) return null
  return (
    <div
      data-testid="offline-indicator"
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 bg-ink px-4 py-2 text-center text-sm font-semibold text-white"
    >
      Ei verkkoyhteyttä – näet viimeksi ladatut sivut ja avaamasi artikkelit.
    </div>
  )
}
