import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const displaySource = await readFile(new URL('../src/pages/TVDisplay.jsx', import.meta.url), 'utf8')
const displayStyles = await readFile(new URL('../src/pages/TVDisplay.css', import.meta.url), 'utf8')

test('venue display keeps calibration controls out of the live header', () => {
  const liveHeader = displaySource.match(/<header className="tv-header">([\s\S]*?)<\/header>/)?.[1] || ''

  assert.doesNotMatch(liveHeader, /tv-size-control/)
  assert.doesNotMatch(liveHeader, /tv-calibrate-button/)
  assert.match(liveHeader, /tv-fullscreen-button/)
})

test('venue display protects the title and upcoming performers from wrapping', () => {
  assert.match(displayStyles, /\.tv-header h1 \{[^}]*white-space:nowrap;/)
  assert.match(displayStyles, /\.tv-ticker-window \{[^}]*white-space:nowrap;/)
  assert.doesNotMatch(displayStyles, /prefers-reduced-motion:reduce[^}]*flex-wrap:wrap;/)
})

test('venue display isolates sidebar regions and gives the QR code its own column', () => {
  assert.match(displayStyles, /\.tv-sidebar section \{[^}]*overflow:hidden;/)
  assert.match(displayStyles, /\.tv-qr-card \{[^}]*grid-template-columns:minmax\(0,1fr\) auto;/)
})
