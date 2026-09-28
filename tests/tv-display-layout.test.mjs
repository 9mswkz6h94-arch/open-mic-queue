import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const displaySource = await readFile(new URL('../src/pages/TVDisplay.jsx', import.meta.url), 'utf8')
const displayStyles = await readFile(new URL('../src/pages/TVDisplay.css', import.meta.url), 'utf8')
const appEntry = await readFile(new URL('../src/index.jsx', import.meta.url), 'utf8')
const spotlightStyles = await readFile(new URL('../src/themes/spotlight.css', import.meta.url), 'utf8')
const fixtureSource = await readFile(new URL('../src/lib/mockFixtures.js', import.meta.url), 'utf8')
const environmentBannerSource = await readFile(new URL('../src/components/EnvironmentBanner.jsx', import.meta.url), 'utf8')
const adminSource = await readFile(new URL('../src/pages/Admin.jsx', import.meta.url), 'utf8')
const appStyles = await readFile(new URL('../src/App.css', import.meta.url), 'utf8')

test('venue display keeps calibration controls out of the live header', () => {
  const liveHeader = displaySource.match(/<header className="tv-header">([\s\S]*?)<\/header>/)?.[1] || ''

  assert.doesNotMatch(liveHeader, /tv-size-control/)
  assert.doesNotMatch(liveHeader, /tv-calibrate-button/)
  assert.match(liveHeader, /tv-fullscreen-button/)
})

test('venue display protects the title and upcoming performers from wrapping', () => {
  assert.match(displayStyles, /\.tv-header h1 \{[^}]*white-space:nowrap;/)
  assert.doesNotMatch(displayStyles, /\.tv-header h1 \{[^}]*text-overflow:ellipsis;/)
  assert.match(displayStyles, /\.tv-ticker-window \{[^}]*white-space:nowrap;/)
  assert.doesNotMatch(displayStyles, /prefers-reduced-motion:reduce[^}]*flex-wrap:wrap;/)
})

test('long event names and donation controls stay bounded inside the TV grid', () => {
  assert.match(displaySource, /tv-event-name-long/)
  assert.match(displayStyles, /\.tv-header h1\.tv-event-name-long/)
  assert.match(displayStyles, /\.tv-donation-heading \{ display:grid;/)
  assert.match(displayStyles, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/)
})

test('venue display isolates sidebar regions and gives the QR code its own column', () => {
  assert.match(displayStyles, /\.tv-sidebar section \{[^}]*overflow:hidden;/)
  assert.match(displayStyles, /\.tv-qr-card \{[^}]*grid-template-columns:minmax\(0,1fr\) auto;/)
  assert.match(displaySource, /isFullscreen \? ' is-fullscreen'/)
  assert.match(displayStyles, /\.tv-display\.is-fullscreen \.tv-qr-card svg \{[^}]*224px/)
  assert.match(displayStyles, /\.tv-display\.is-fullscreen \.tv-donation-card svg \{[^}]*136px/)
})

test('venue display applies the accepted Spotlight focus identity', () => {
  assert.match(displaySource, /data-rh-theme="spotlight"/)
  assert.match(displaySource, /data-spotlight-expression="focus"/)
  assert.match(displayStyles, /font-family:"Instrument Sans"/)
  assert.match(displayStyles, /--spotlight-live:#ff904e;/)
  assert.match(displayStyles, /--spotlight-on-deck:#8b51fe;/)
  assert.match(displayStyles, /\.tv-performer-content::before \{[^}]*radial-gradient/)
  assert.doesNotMatch(displayStyles, /\.tv-performer-content::after/)
})

test('the full application loads the Spotlight identity after Scaffold', () => {
  assert.match(appEntry, /import '\.\/themes\/scaffold\.css'[\s\S]*import '\.\/themes\/spotlight\.css'/)
  assert.match(spotlightStyles, /--spotlight-canvas: #120f10;/)
  assert.match(spotlightStyles, /--spotlight-live: #ff904e;/)
  assert.match(spotlightStyles, /--spotlight-focus: #00baff;/)
  assert.match(spotlightStyles, /--spotlight-on-deck: #8b51fe;/)
  assert.match(spotlightStyles, /--spotlight-complete: #60e027;/)
  assert.match(spotlightStyles, /--spotlight-danger: #ff1717;/)
})

test('Spotlight keeps structural state cues alongside purpose color', () => {
  assert.match(spotlightStyles, /\.on-deck-card \{[^}]*border-left-color: var\(--spotlight-on-deck\);/)
  assert.match(spotlightStyles, /\.completed-performer,[\s\S]*\.completed-item \{[^}]*border-left-color: var\(--spotlight-complete\);/)
  assert.match(spotlightStyles, /\.error-message \{[^}]*border-left: 5px solid var\(--spotlight-danger\);/)
  assert.match(spotlightStyles, /outline: 3px solid var\(--spotlight-focus\);/)
})

test('tonight show demo uses public presentation data and placeholder contact addresses', () => {
  const tonightFixture = fixtureSource.match(/'tonight-show': \[([\s\S]*?)\n  \],/)?.[1] || ''
  assert.match(tonightFixture, /stage_name: 'Brother Jon'/)
  assert.match(tonightFixture, /profile_picture_url: 'https:\/\/azfexlhbiivcyjqfkgxz\.supabase\.co\/storage\/v1\/object\/public\/performers\/profile-pictures\//)
  assert.match(tonightFixture, /stage_name: 'Charissa'/)
  const emails = [...tonightFixture.matchAll(/email: '([^']+)'/g)].map((match) => match[1])
  assert.ok(emails.length > 0)
  assert.ok(emails.every((email) => email.endsWith('@example.test')))
  assert.match(environmentBannerSource, /'tonight-show'/)
})

test('desktop host queue separates performer details from its action grid', () => {
  assert.match(adminSource, /performer\.real_name !== performer\.stage_name/)
  assert.match(appStyles, /\.host-command-queue \.queue-actions \{[\s\S]*?grid-column: 1 \/ -1;/)
  assert.match(appStyles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/)
})
