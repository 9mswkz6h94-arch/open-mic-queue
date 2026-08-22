import { cloneFixture, mockUser } from './mockFixtures'

const STORAGE_KEY = 'open-mic-queue:mock-performers:v1'
const listeners = new Set()
let currentUser = mockUser

function fixtureName() {
  return new URLSearchParams(window.location.search).get('fixture') || 'default'
}

function readRows() {
  const fixture = fixtureName()
  if (fixture === 'error') throw new Error('Fixture error: the queue service is unavailable.')
  const saved = localStorage.getItem(`${STORAGE_KEY}:${fixture}`)
  if (saved) return JSON.parse(saved)
  const rows = cloneFixture(fixture)
  localStorage.setItem(`${STORAGE_KEY}:${fixture}`, JSON.stringify(rows))
  return rows
}

function writeRows(rows) {
  localStorage.setItem(`${STORAGE_KEY}:${fixtureName()}`, JSON.stringify(rows))
}

class MockQuery {
  constructor(action = 'select', payload = null) {
    this.action = action
    this.payload = payload
    this.filters = []
    this.sort = null
    this.max = null
    this.expectSingle = false
  }

  select() { return this }
  insert(payload) { this.action = 'insert'; this.payload = payload; return this }
  update(payload) { this.action = 'update'; this.payload = payload; return this }
  delete() { this.action = 'delete'; return this }
  eq(field, value) { this.filters.push(row => row[field] === value); return this }
  gt(field, value) { this.filters.push(row => row[field] > value); return this }
  order(field, options = {}) { this.sort = { field, ascending: options.ascending !== false }; return this }
  limit(value) { this.max = value; return this }
  single() { this.expectSingle = true; return this }

  async execute() {
    await new Promise(resolve => setTimeout(resolve, fixtureName() === 'loading' ? 1200 : 80))
    try {
      let rows = readRows()
      const matches = row => this.filters.every(filter => filter(row))
      let data = rows.filter(matches)

      if (this.action === 'insert') {
        const additions = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((row, index) => ({
          ...row,
          id: row.id || `mock-${Date.now()}-${index}`,
        }))
        rows = [...rows, ...additions]
        writeRows(rows)
        data = additions
      } else if (this.action === 'update') {
        rows = rows.map(row => matches(row) ? { ...row, ...this.payload } : row)
        writeRows(rows)
        data = rows.filter(matches)
      } else if (this.action === 'delete') {
        const removed = rows.filter(matches)
        rows = rows.filter(row => !matches(row))
        writeRows(rows)
        data = removed
      }

      if (this.sort) {
        const direction = this.sort.ascending ? 1 : -1
        data = [...data].sort((a, b) => (a[this.sort.field] > b[this.sort.field] ? direction : -direction))
      }
      if (this.max !== null) data = data.slice(0, this.max)
      if (this.expectSingle) {
        if (data.length !== 1) return { data: null, error: { message: data.length ? 'Multiple mock rows found' : 'No mock row found' } }
        return { data: data[0], error: null }
      }
      return { data, error: null }
    } catch (error) {
      return { data: null, error: { message: error.message } }
    }
  }

  then(resolve, reject) { return this.execute().then(resolve, reject) }
}

export function resetMockData(nextFixture = fixtureName()) {
  localStorage.setItem(`${STORAGE_KEY}:${nextFixture}`, JSON.stringify(cloneFixture(nextFixture)))
}

export const mockSupabase = {
  from() { return new MockQuery() },
  auth: {
    async getSession() { return { data: { session: currentUser ? { user: currentUser } : null }, error: null } },
    onAuthStateChange(callback) { listeners.add(callback); return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } } },
    async signInWithPassword() { currentUser = mockUser; listeners.forEach(listener => listener('SIGNED_IN', { user: currentUser })); return { data: { user: currentUser }, error: null } },
    async signUp() { currentUser = mockUser; listeners.forEach(listener => listener('SIGNED_IN', { user: currentUser })); return { data: { user: currentUser }, error: null } },
    async signOut() { currentUser = null; listeners.forEach(listener => listener('SIGNED_OUT', null)); return { error: null } },
  },
  storage: {
    from() {
      return {
        async upload() { return { data: null, error: { message: 'File uploads are disabled in mock review mode.' } } },
        getPublicUrl() { return { data: { publicUrl: '' } } },
      }
    },
  },
}
