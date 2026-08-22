import { dataMode, isMockMode } from '@dataClient'
import { resetMockData } from '../lib/mockSupabaseClient'

const fixtures = ['default', 'empty', 'loading', 'error', 'long']

export default function EnvironmentBanner() {
  if (!import.meta.env.DEV) return null

  const params = new URLSearchParams(window.location.search)
  const activeFixture = params.get('fixture') || 'default'

  function loadFixture(event) {
    const fixture = event.target.value
    resetMockData(fixture)
    params.set('dataMode', 'mock')
    params.set('fixture', fixture)
    window.location.search = params.toString()
  }

  function enterMockMode() {
    resetMockData('default')
    params.set('dataMode', 'mock')
    params.set('fixture', 'default')
    window.location.search = params.toString()
  }

  return (
    <aside className={`environment-banner ${isMockMode ? 'environment-banner-mock' : 'environment-banner-production'}`} aria-label="Review environment">
      <div>
        <strong>{isMockMode ? 'Mock-isolated review' : 'Production-connected static review'}</strong>
        <span>{isMockMode ? 'Local fixture data only. Safe to operate and reset.' : 'Do not submit forms or use controls that change data.'}</span>
      </div>
      {isMockMode ? (
        <label>
          Fixture
          <select value={activeFixture} onChange={loadFixture}>
            {fixtures.map(fixture => <option key={fixture} value={fixture}>{fixture}</option>)}
          </select>
        </label>
      ) : (
        <button type="button" className="btn btn-small" onClick={enterMockMode}>Enter safe mock mode</button>
      )}
      <code>{dataMode}</code>
    </aside>
  )
}
