import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './mockSupabaseClient'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const requestedMode = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get('dataMode')
  : null

export const dataMode = requestedMode === 'production'
  ? 'production-connected-static-only'
  : 'mock-isolated'

export const isMockMode = dataMode === 'mock-isolated'

if (!isMockMode && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = isMockMode ? mockSupabase : createClient(supabaseUrl, supabaseAnonKey)
