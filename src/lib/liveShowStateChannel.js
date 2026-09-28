const CHANNEL_PREFIX = 'open-mic-queue:live-show-state:v1'
export const LIVE_SHOW_STATE_EVENT = 'open-mic-live-show-state-change'

function channelKey(eventSlug) {
  const fixture = new URLSearchParams(window.location.search).get('fixture') || 'default'
  return `${CHANNEL_PREFIX}:${eventSlug}:${fixture}`
}

export function readLiveShowState(eventSlug) {
  try {
    const saved = window.localStorage.getItem(channelKey(eventSlug))
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export function publishLiveSongState(eventSlug, state) {
  const published = { ...state, updatedAt: new Date().toISOString() }
  window.localStorage.setItem(channelKey(eventSlug), JSON.stringify(published))
  window.dispatchEvent(new CustomEvent(LIVE_SHOW_STATE_EVENT, { detail: published }))
  return published
}
