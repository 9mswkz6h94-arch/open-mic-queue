const DB_NAME = 'open-mic-queue-timeline'
const STORE_NAME = 'cue-outbox'
const DB_VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'clientCueId' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function transact(mode, operation) {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode)
      const request = operation(tx.objectStore(STORE_NAME))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export const indexedDbOutbox = {
  put: item => transact('readwrite', store => store.put(item)),
  list: () => transact('readonly', store => store.getAll()),
  remove: clientCueId => transact('readwrite', store => store.delete(clientCueId)),
}

export async function replayOutbox(storage, sender) {
  const items = (await storage.list()).sort((a, b) => a.queuedAt.localeCompare(b.queuedAt))
  const result = { sent: 0, pending: items.length, errors: [] }
  for (const item of items) {
    try {
      await sender(item.payload)
      await storage.remove(item.clientCueId)
      result.sent += 1
      result.pending -= 1
    } catch (error) {
      result.errors.push({ clientCueId: item.clientCueId, message: error.message })
      break
    }
  }
  return result
}

export function outboxItem(payload, queuedAt = new Date().toISOString()) {
  const clientCueId = payload.outboxId || payload.clientCueId
  return { clientCueId, eventId: payload.eventId, queuedAt, payload }
}
