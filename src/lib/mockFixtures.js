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
  'missing-titles': [
    { ...base, id: 'mock-missing-1', stage_name: 'River James', real_name: 'River James', email: 'river@example.test', song_1_title: null, song_2_title: null, song_titles: [], social_links: {}, performer_notes: 'No song titles were supplied. Every surface should derive Song 1, Song 2, and so on without storing invented titles.', queue_position: 1, current: true, attended: false, auth_user_id: null, started_at: '2026-08-23T01:00:00.000Z', completed_at: null },
    { ...base, id: 'mock-missing-2', stage_name: 'Maya Stone', real_name: 'Maya Stone', email: 'maya@example.test', song_1_title: 'First Light', song_2_title: null, song_titles: ['First Light', null], social_links: {}, performer_notes: null, queue_position: 2, current: false, attended: false, auth_user_id: null, started_at: null, completed_at: null },
  ],
  'featured-artist': [
    { ...base, id: 'mock-featured-1', stage_name: 'Luthor Morgan', real_name: 'Luthor Morgan', email: 'featured@example.test', song_1_title: 'Changes', song_2_title: 'Skipping Stones', song_titles: ['Changes', 'Skipping Stones', "Ain't That Somethin'", 'American Culture', "Mean Ol' Thing", 'Southbound on 35', 'Home Again'], social_links: { youtube: 'https://youtube.com/@example' }, performer_notes: 'Featured Artist fixture with an extended biography, interview answers, approved media, and a seven-song set.', queue_position: 1, current: true, attended: false, auth_user_id: 'mock-featured-user', entry_role: 'featured_artist', spotlight_status: 'published', started_at: '2026-08-24T00:00:00.000Z', completed_at: null },
    { ...base, id: 'mock-featured-2', stage_name: 'Nate Gringo', real_name: 'Nate Gringo', email: 'next@example.test', song_1_title: '45 Dreaming', song_2_title: 'Lord Algorithm', song_titles: ['45 Dreaming', 'Lord Algorithm'], social_links: {}, queue_position: 2, current: false, attended: false, auth_user_id: 'mock-next-user', started_at: null, completed_at: null },
  ],
  'cross-midnight': [
    { ...base, id: 'mock-midnight-1', stage_name: 'Midnight Radio', real_name: 'Casey North', email: 'midnight@example.test', song_1_title: 'One More Before Tomorrow', song_2_title: 'After Midnight', song_titles: ['One More Before Tomorrow', 'After Midnight'], social_links: {}, queue_position: 1, current: false, attended: true, auth_user_id: 'mock-midnight-user', started_at: '2026-08-24T04:58:00.000Z', completed_at: '2026-08-24T05:12:00.000Z' },
    { ...base, id: 'mock-midnight-2', stage_name: 'Early Hours', real_name: 'Jordan Blue', email: 'early@example.test', song_1_title: null, song_2_title: null, song_titles: [], social_links: {}, queue_position: 2, current: true, attended: false, auth_user_id: 'mock-early-user', started_at: '2026-08-24T05:13:00.000Z', completed_at: null },
  ],
  supporter: [
    { ...base, id: 'mock-supporter-1', stage_name: 'Northbound Static', real_name: 'Avery Lane', email: 'avery@example.test', song_1_title: 'County Line', song_2_title: 'Slow Signal', song_titles: ['County Line', 'Slow Signal'], social_links: {}, queue_position: 1, current: true, attended: false, auth_user_id: 'mock-performer-1', display_prompt_fixture: { type: 'supporter_acknowledgement', message: 'Thanks to Sam for supporting local music', status: 'published' }, started_at: '2026-08-24T00:00:00.000Z', completed_at: null },
  ],
  announcement: [
    { ...base, id: 'mock-announcement-1', stage_name: 'Juniper & Wire', real_name: 'Theo Brooks', email: 'theo@example.test', song_1_title: 'Copper String', song_2_title: 'After the Flood', song_titles: ['Copper String', 'After the Flood'], social_links: {}, queue_position: 1, current: true, attended: false, auth_user_id: 'mock-performer-3', display_prompt_fixture: { type: 'announcement', message: 'Last call for performer signups at 9:30 PM', status: 'published' }, started_at: '2026-08-24T00:00:00.000Z', completed_at: null },
  ],
  stress: [
    { ...base, id: 'mock-stress-1', stage_name: 'The Remarkably Long Featured Performer Name Collective', real_name: 'Alexandria Montgomery-Washington', email: 'stress@example.test', song_1_title: null, song_2_title: 'A Fully Supplied Second Song With a Long Descriptive Name', song_titles: [null, 'A Fully Supplied Second Song With a Long Descriptive Name', null, 'Fourth Song'], social_links: { website: 'https://example.com/a/long/path' }, performer_notes: 'Combined fixture: featured role, missing and long song titles, long copy, a supporter acknowledgement, and a cross-date performance window.', queue_position: 1, current: true, attended: false, auth_user_id: 'mock-stress-user', entry_role: 'featured_artist', spotlight_status: 'published', display_prompt_fixture: { type: 'supporter_acknowledgement', message: 'Thanks to The Nelson Community Arts Fund for supporting tonight’s artists', status: 'published' }, started_at: '2026-08-24T04:58:00.000Z', completed_at: null },
    ...Array.from({ length: 12 }, (_, index) => ({ ...base, id: `mock-stress-${index + 2}`, stage_name: `Stress Fixture Performer ${index + 2}`, real_name: `Fixture Person ${index + 2}`, email: `stress-${index + 2}@example.test`, song_1_title: index % 2 ? null : `Song supplied by artist ${index + 2}`, song_2_title: null, song_titles: index % 2 ? [] : [`Song supplied by artist ${index + 2}`, null], social_links: {}, queue_position: index + 2, current: false, attended: false, auth_user_id: `mock-stress-user-${index + 2}`, started_at: null, completed_at: null })),
  ],
  long: [
    { ...base, id: 'mock-long-1', stage_name: 'The Remarkably Long and Entirely Intentional Performer Name Collective', real_name: 'Alexandria Montgomery-Washington the Third', email: 'long@example.test', song_1_title: 'A Song Title Designed to Test Wrapping Without Hiding Any Meaningful Information', song_2_title: 'Another Extremely Descriptive Song Title for a Narrow Tablet Screen', social_links: { website: 'https://example.com/a/very/long/path/that/should/not/control/layout' }, performer_notes: 'This intentionally long artist note tests wrapping, zoom, narrow screens, and whether every piece of content remains understandable without horizontal page scrolling. It is fixture data only.', queue_position: 1, current: true, attended: false, auth_user_id: 'mock-admin-user', started_at: '2026-08-09T23:00:00.000Z', completed_at: null },
    ...Array.from({ length: 10 }, (_, index) => ({ ...base, id: `mock-long-${index + 2}`, stage_name: `Fixture Performer With Long Name ${index + 2}`, real_name: `Review Person ${index + 2}`, email: `fixture-${index + 2}@example.test`, song_1_title: `Long-form original song number ${index + 2}`, song_2_title: 'Second title with enough words to wrap naturally', social_links: {}, queue_position: index + 2, current: false, attended: false, auth_user_id: `mock-user-${index + 2}`, started_at: null, completed_at: null })),
  ],
}

export const mockScenarioDescriptions = {
  default: 'Normal event with current, on-deck, and performed entries.',
  empty: 'No performers have signed up.',
  loading: 'Delayed queue response for loading-state review.',
  error: 'Queue service unavailable.',
  long: 'Long names, notes, links, and a large queue.',
  'missing-titles': 'Missing and partially supplied song titles; expect Song N fallbacks.',
  'featured-artist': 'Published Featured Artist with seven songs and spotlight content.',
  'cross-midnight': 'A valid performance spanning two local dates.',
  supporter: 'Published supporter acknowledgement without obscuring event state.',
  announcement: 'Published operational announcement in the controlled display region.',
  stress: 'Combined long, missing, featured, prompt, and large-queue stress state.',
}

export function cloneFixture(name = 'default') {
  return structuredClone(mockFixtures[name] || mockFixtures.default)
}
