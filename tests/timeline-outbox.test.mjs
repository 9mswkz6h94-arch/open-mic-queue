import test from 'node:test'
import assert from 'node:assert/strict'
import { outboxItem, replayOutbox } from '../src/lib/timelineOutbox.js'

function memoryStorage(seed = []) {
  const map = new Map(seed.map(item => [item.clientCueId, item]))
  return { put: async item => map.set(item.clientCueId, item), list: async () => [...map.values()], remove: async id => map.delete(id), map }
}

test('outbox survives reconstruction and replays in queued order', async () => {
  const first = memoryStorage()
  await first.put(outboxItem({ clientCueId: 'b', eventId: 'event', cueType: 'highlight' }, '2026-09-27T02:00:00Z'))
  await first.put(outboxItem({ clientCueId: 'a', eventId: 'event', cueType: 'audio_issue' }, '2026-09-27T01:00:00Z'))
  const restarted = memoryStorage(await first.list())
  const sent = []
  const result = await replayOutbox(restarted, async payload => sent.push(payload.clientCueId))
  assert.deepEqual(sent, ['a', 'b'])
  assert.equal(result.pending, 0)
  assert.equal(restarted.map.size, 0)
})

test('stable cue id prevents duplicate queued records', async () => {
  const storage = memoryStorage()
  await storage.put(outboxItem({ clientCueId: 'same', eventId: 'event', cueType: 'highlight', note: 'first' }))
  await storage.put(outboxItem({ clientCueId: 'same', eventId: 'event', cueType: 'highlight', note: 'retry' }))
  assert.equal((await storage.list()).length, 1)
  assert.equal((await storage.list())[0].payload.note, 'retry')
})

test('replay stops at first failure and retains remaining cues', async () => {
  const storage = memoryStorage([outboxItem({ clientCueId: 'a', eventId: 'event' }, '2026-09-27T01:00:00Z'), outboxItem({ clientCueId: 'b', eventId: 'event' }, '2026-09-27T02:00:00Z')])
  const result = await replayOutbox(storage, async () => { throw new Error('offline') })
  assert.equal(result.pending, 2)
  assert.equal(result.errors.length, 1)
  assert.equal(storage.map.size, 2)
})
