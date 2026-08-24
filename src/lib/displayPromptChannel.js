import { supabase } from '@dataClient'

const CHANNEL_PREFIX = 'open-mic-queue:display-prompt:v1'
export const DISPLAY_PROMPT_EVENT = 'open-mic-display-prompt-change'

function channelKey(eventSlug) {
  const fixture = new URLSearchParams(window.location.search).get('fixture') || 'default'
  return `${CHANNEL_PREFIX}:${eventSlug}:${fixture}`
}

function normalizePrompt(row) {
  if (!row) return null
  return {
    id: row.id,
    type: row.prompt_type,
    label: row.prompt_type === 'announcement' ? 'Announcement' : 'Supporter acknowledgement',
    region: row.region,
    content: row.content?.message || '',
    status: 'published',
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
  }
}

export function isMockDisplayPromptChannel() {
  return import.meta.env.DEV
}

export function isProductionDisplayPromptChannel() {
  return !import.meta.env.DEV
}

export async function readDisplayPrompt(eventSlug) {
  if (isMockDisplayPromptChannel()) {
    try {
      const saved = window.localStorage.getItem(channelKey(eventSlug))
      if (!saved) return null
      const prompt = JSON.parse(saved)
      if (prompt.status !== 'published') return null
      if (prompt.expiresAt && new Date(prompt.expiresAt) <= new Date()) return null
      return prompt
    } catch {
      return null
    }
  }

  const { data, error } = await supabase
    .from('public_active_display_prompts')
    .select('id,prompt_type,region,priority,content,published_at,expires_at')
    .eq('event_slug', eventSlug)
    .order('priority', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return normalizePrompt(data)
}

export async function createDisplayPrompt(eventSlug, eventId, prompt, userId) {
  if (isMockDisplayPromptChannel()) return { ...prompt, id: `mock-prompt-${Date.now()}` }
  if (prompt.type !== 'announcement') throw new Error('Production supporter publication remains locked pending linked consent verification.')
  if (!eventId) throw new Error(`No durable event ID is available for ${eventSlug}.`)

  const { data, error } = await supabase
    .from('display_prompts')
    .insert({
      event_id: eventId,
      prompt_type: prompt.type,
      region: prompt.region,
      content: { message: prompt.content },
      status: 'draft',
      created_by: userId,
    })
    .select('id')
    .single()

  if (error) throw error
  return { ...prompt, id: data.id }
}

export async function previewDisplayPrompt(prompt) {
  if (isMockDisplayPromptChannel()) return
  const { error } = await supabase.from('display_prompts').update({ status: 'previewed' }).eq('id', prompt.id)
  if (error) throw error
}

export async function publishDisplayPrompt(eventSlug, prompt, userId, durationMinutes) {
  const publishedAt = new Date()
  const published = {
    ...prompt,
    status: 'published',
    publishedAt: publishedAt.toISOString(),
    expiresAt: new Date(publishedAt.getTime() + durationMinutes * 60_000).toISOString(),
  }

  if (isMockDisplayPromptChannel()) {
    window.localStorage.setItem(channelKey(eventSlug), JSON.stringify(published))
    window.dispatchEvent(new CustomEvent(DISPLAY_PROMPT_EVENT, { detail: published }))
    return published
  }

  const { error } = await supabase
    .from('display_prompts')
    .update({ status: 'published', published_by: userId, published_at: published.publishedAt, expires_at: published.expiresAt })
    .eq('id', prompt.id)

  if (error) throw error
  return published
}

export async function clearDisplayPrompt(eventSlug, prompt, status = 'cleared') {
  if (isMockDisplayPromptChannel()) {
    window.localStorage.removeItem(channelKey(eventSlug))
    window.dispatchEvent(new CustomEvent(DISPLAY_PROMPT_EVENT, { detail: { status } }))
    return
  }

  const changes = { status }
  if (status === 'cleared') changes.cleared_at = new Date().toISOString()
  const { error } = await supabase.from('display_prompts').update(changes).eq('id', prompt.id)
  if (error) throw error
}
