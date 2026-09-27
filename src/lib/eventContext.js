import { useEffect, useState } from 'react'
import { isMockMode, supabase } from '@dataClient'

export const MOCK_EVENT_ID = '00000000-0000-4000-8000-000000000002'

export async function resolveEvent(eventSlug) {
  if (isMockMode) {
    return { id: MOCK_EVENT_ID, slug: eventSlug, title: 'Legacy Open Mic Reference Event', timezone: 'America/Chicago', status: 'running', signup_open: true }
  }
  const { data, error } = await supabase.from('events').select('id, slug, title, timezone, status, signup_open, starts_at, ends_at').eq('slug', eventSlug).single()
  if (error) throw error
  return data
}

export function useEventRecord(eventSlug) {
  const [state, setState] = useState({ event: null, loading: true, error: '' })
  useEffect(() => {
    let active = true
    setState({ event: null, loading: true, error: '' })
    resolveEvent(eventSlug)
      .then(event => active && setState({ event, loading: false, error: '' }))
      .catch(error => active && setState({ event: null, loading: false, error: error.message || 'Event unavailable' }))
    return () => { active = false }
  }, [eventSlug])
  return state
}
