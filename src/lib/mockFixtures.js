const base = {
  original_confirmed: true,
  livestream_confirmed: true,
  radio_featured_confirmed: true,
  email_opt_in: false,
  profile_picture_url: null,
}

export const mockUser = {
  id: 'mock-admin-user',
  email: 'jonathan@rainbowheart.studio',
}

export const mockFixtures = {
  default: [
    { ...base, id: 'mock-1', stage_name: 'Northbound Static', real_name: 'Avery Lane', email: 'avery@example.test', song_1_title: 'County Line', song_2_title: 'Slow Signal', song_titles: ['County Line', 'Slow Signal', 'Porch Light', 'Last Exit', 'Home Before Dawn'], social_links: { instagram: 'https://instagram.com/example' }, performer_notes: 'Songs about long roads, found family, and learning when to leave the porch light on.', queue_position: 1, current: true, attended: false, auth_user_id: 'mock-performer-1', started_at: '2026-08-09T23:00:00.000Z', completed_at: null },
    { ...base, id: 'mock-2', stage_name: 'Marisol Vega', real_name: 'Marisol Vega', email: 'marisol@example.test', song_1_title: 'Paper Moons', song_2_title: 'Borrowed Weather', social_links: {}, queue_position: 2, current: false, attended: false, auth_user_id: 'mock-performer-2', started_at: null, completed_at: null },
    { ...base, id: 'mock-3', stage_name: 'Juniper & Wire', real_name: 'Theo Brooks', email: 'theo@example.test', song_1_title: 'Copper String', song_2_title: 'After the Flood', social_links: { website: 'https://example.com' }, queue_position: 3, current: false, attended: false, auth_user_id: 'mock-performer-3', started_at: null, completed_at: null },
    { ...base, id: 'mock-4', stage_name: 'The Quiet Hours', real_name: 'Morgan Reed', email: 'morgan@example.test', song_1_title: 'Kitchen Light', song_2_title: 'Half Past Home', social_links: {}, queue_position: 4, current: false, attended: false, auth_user_id: 'mock-performer-4', started_at: '2026-08-09T22:30:00.000Z', completed_at: '2026-08-09T22:42:00.000Z', attended: true },
  ],
  empty: [],
  'name-only': [
    { ...base, id: 'mock-name-only-1', stage_name: 'River James', real_name: 'River James', email: 'river@example.test', song_1_title: null, song_2_title: null, song_titles: [], social_links: {}, performer_notes: null, queue_position: 1, current: true, attended: false, auth_user_id: null, started_at: '2026-08-23T01:00:00.000Z', completed_at: null },
    { ...base, id: 'mock-name-only-2', stage_name: 'Maya Stone', real_name: 'Maya Stone', email: 'maya@example.test', song_1_title: null, song_2_title: null, song_titles: [], social_links: {}, performer_notes: null, queue_position: 2, current: false, attended: false, auth_user_id: null, started_at: null, completed_at: null },
  ],
  long: [
    { ...base, id: 'mock-long-1', stage_name: 'The Remarkably Long and Entirely Intentional Performer Name Collective', real_name: 'Alexandria Montgomery-Washington the Third', email: 'long@example.test', song_1_title: 'A Song Title Designed to Test Wrapping Without Hiding Any Meaningful Information', song_2_title: 'Another Extremely Descriptive Song Title for a Narrow Tablet Screen', social_links: { website: 'https://example.com/a/very/long/path/that/should/not/control/layout' }, performer_notes: 'This intentionally long artist note tests wrapping, zoom, narrow screens, and whether every piece of content remains understandable without horizontal page scrolling. It is fixture data only.', queue_position: 1, current: true, attended: false, auth_user_id: 'mock-admin-user', started_at: '2026-08-09T23:00:00.000Z', completed_at: null },
    ...Array.from({ length: 10 }, (_, index) => ({ ...base, id: `mock-long-${index + 2}`, stage_name: `Fixture Performer With Long Name ${index + 2}`, real_name: `Review Person ${index + 2}`, email: `fixture-${index + 2}@example.test`, song_1_title: `Long-form original song number ${index + 2}`, song_2_title: 'Second title with enough words to wrap naturally', social_links: {}, queue_position: index + 2, current: false, attended: false, auth_user_id: `mock-user-${index + 2}`, started_at: null, completed_at: null })),
  ],
}

export function cloneFixture(name = 'default') {
  return structuredClone(mockFixtures[name] || mockFixtures.default)
}
