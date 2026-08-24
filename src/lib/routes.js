export const DEFAULT_EVENT_SLUG = import.meta.env.VITE_EVENT_SLUG || 'legacy-open-mic-reference-2026-08-23'

export function eventPath(eventSlug = DEFAULT_EVENT_SLUG, destination = '') {
  const suffix = destination ? `/${destination.replace(/^\//, '')}` : ''
  return `/e/${encodeURIComponent(eventSlug)}${suffix}`
}

export function hostPath(eventSlug = DEFAULT_EVENT_SLUG) {
  return `/host/events/${encodeURIComponent(eventSlug)}`
}

export function parseLocation(location = window.location) {
  const query = new URLSearchParams(location.search)
  const segments = location.pathname.split('/').filter(Boolean).map(decodeURIComponent)

  if (query.get('display') === 'tv') {
    return { page: 'display', eventSlug: DEFAULT_EVENT_SLUG, legacy: true }
  }

  if (segments[0] === 'e' && segments[1]) {
    if (segments[1] !== DEFAULT_EVENT_SLUG) {
      return { page: 'not-found', eventSlug: DEFAULT_EVENT_SLUG, requestedEventSlug: segments[1], legacy: false }
    }
    const destination = segments[2] || 'home'
    const pages = { signup: 'signup', 'my-entry': 'edit-entry', queue: 'home', display: 'display' }
    return {
      page: pages[destination] || (destination === 'home' ? 'home' : 'not-found'),
      eventSlug: segments[1],
      destination,
      legacy: false,
    }
  }

  if (segments[0] === 'host' && segments[1] === 'events' && segments[2]) {
    if (segments[2] !== DEFAULT_EVENT_SLUG) {
      return { page: 'not-found', eventSlug: DEFAULT_EVENT_SLUG, requestedEventSlug: segments[2], legacy: false }
    }
    return { page: 'admin', eventSlug: segments[2], legacy: false }
  }

  if (segments.length === 0) {
    return { page: 'home', eventSlug: DEFAULT_EVENT_SLUG, legacy: true }
  }

  return { page: 'not-found', eventSlug: DEFAULT_EVENT_SLUG, legacy: false }
}

export function pathForPage(page, eventSlug = DEFAULT_EVENT_SLUG) {
  const paths = {
    home: eventPath(eventSlug),
    signup: eventPath(eventSlug, 'signup'),
    'edit-entry': eventPath(eventSlug, 'my-entry'),
    admin: hostPath(eventSlug),
    display: eventPath(eventSlug, 'display'),
  }
  return paths[page] || eventPath(eventSlug)
}

export function navigate(path, { replace = false } = {}) {
  window.history[replace ? 'replaceState' : 'pushState']({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
