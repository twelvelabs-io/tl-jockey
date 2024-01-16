import type { AxiosAdapter } from 'axios'

import axios from 'axios'

const API_VERSION = ''
const  BASE_API_URL = ''
// defaults
axios.defaults.withCredentials = true
axios.defaults.headers.common['Content-Type'] = 'application/json'

export const X_API_KEY = 'x-api-key'

const PLAYGROUND_API_URL = `${BASE_API_URL}/p`

export const twelveLabsAPI = axios.create({
	baseURL: `${PLAYGROUND_API_URL}/${API_VERSION}`
})

export const sampleAPI = axios.create({
	baseURL: `${PLAYGROUND_API_URL}/samples/${API_VERSION}`
})

export const playgroundAPI = axios.create({
	baseURL: PLAYGROUND_API_URL
})

export const internalAPI = axios.create({
	baseURL: `${PLAYGROUND_API_URL}/internal`
})

export const nextAPI = axios.create({
	baseURL: '/api'
})

export const authAPI = axios.create({
	baseURL: `${BASE_API_URL}/tl`,
	headers: { 'Cache-Control': 'no-cache' }
})
