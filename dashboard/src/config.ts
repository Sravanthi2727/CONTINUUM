export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

/** Mock-first: anything other than the string "false" uses local data. */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'

/**
 * Demo API mode:
 * Set to true if Member A provides POST /demo/:scenario.
 * Set to false (default) to send prepared payloads directly to POST /events and POST /runs.
 */
export const USE_DEMO_SCENARIO_API = false

export const TEAM_NAME = 'CONTINUUM'
export const REPO_URL = 'https://github.com/Sravanthi2727/CONTINUUM'
export const DEMO_VIDEO_URL = '#' // TODO: Add demo video link once recorded
