const WebSocket = require('ws')
const http = require('http')
const https = require('https')

const DEFAULT_ORIGIN = 'http://web-control.yololiv.com'
const AUTH_TTL_MS = 60_000

class YoloboxClient {
	constructor(logFn, host, port = 8887, options = {}) {
		this.log = logFn || (() => null)
		this.host = host
		this.port = Number(port) || 8887
		this.timeout = options.timeout ?? 4000
		this.httpPort = options.httpPort ? Number(options.httpPort) : 8080
		this.httpAgent =
			this.httpPort === 443 || this.httpPort === 8443
				? new https.Agent({ keepAlive: true })
				: new http.Agent({ keepAlive: true })

		this.cookieJar = new Map()
		this.authenticated = false
		this.lastAuthTimestamp = 0
		this.authTtl = options.authTtl ?? AUTH_TTL_MS
		this.authPromise = null
	}

	setEndpoint(host, port) {
		this.host = host
		this.port = Number(port) || 8887
	}

	buildUrl(path) {
		if (!this.host) {
			throw new Error('Host is not configured')
		}
		const sanitisedPath = path.startsWith('/') ? path : `/${path}`
		return `ws://${this.host}:${this.port}${sanitisedPath}`
	}

	buildHttpUrl(path) {
		if (!this.host) {
			throw new Error('Host is not configured')
		}
		const sanitisedPath = path.startsWith('/') ? path : `/${path}`
		const protocol = this.httpPort === 443 || this.httpPort === 8443 ? 'https' : 'http'
		return `${protocol}://${this.host}:${this.httpPort}${sanitisedPath}`
	}

	async request(path, options = {}) {
		const { skipAuth = false, maxRetries = 1 } = options ?? {}

		if (!skipAuth) {
			await this.ensureAuthenticated()
		}

		let attempt = 0
		while (true) {
			try {
				return await this.rawRequest(path, options)
			} catch (err) {
				const retriable =
					typeof err?.message === 'string' &&
					(
						err.message.includes('Connection closed before a response was received') ||
						err.message.includes('WebSocket request timed out')
					)

				if (err?.authFailed && attempt < maxRetries) {
					await this.ensureAuthenticated(true)
					attempt++
					continue
				}

				if (retriable && attempt < maxRetries) {
					if (!skipAuth) {
						await this.ensureAuthenticated(true)
					}
					await new Promise((resolve) => setTimeout(resolve, 150))
					attempt++
					continue
				}

				throw err
			}
		}
	}

	async ensureAuthenticated(force = false) {
		if (force) {
			this.invalidateSession()
		}
		if (!force && this.authenticated && Date.now() - this.lastAuthTimestamp < this.authTtl) {
			return
		}

		if (this.authPromise) {
			return this.authPromise
		}

		const runAuth = async () => {
			try {
				await this.rawRequest('/remote/controller/authenticate', {
					logLevel: 'debug',
					expectResponse: false,
				})

				this.authenticated = true
				this.lastAuthTimestamp = Date.now()
				return
			} catch (err) {
				if (!err?.authFailed) {
					err.authFailed = true
				}
				this.invalidateSession()
				throw err
			} finally {
				this.authPromise = null
			}
		}

		this.authPromise = runAuth()
		return this.authPromise
	}

	invalidateSession() {
		this.authenticated = false
		this.lastAuthTimestamp = 0
		this.cookieJar.clear()
	}

	buildCookieHeader() {
		if (!this.cookieJar.size) return null
		return Array.from(this.cookieJar.entries())
			.map(([name, value]) => `${name}=${value}`)
			.join('; ')
	}

	updateCookiesFromResponse(res) {
		const setCookie = res?.headers?.['set-cookie']
		if (!setCookie) return

		const entries = Array.isArray(setCookie) ? setCookie : [setCookie]
		for (const cookie of entries) {
			if (!cookie) continue
			const [pair] = cookie.split(';')
			if (!pair) continue
			const idx = pair.indexOf('=')
			if (idx <= 0) continue
			const name = pair.slice(0, idx).trim()
			const value = pair.slice(idx + 1).trim()
			if (name) {
				this.cookieJar.set(name, value)
			}
		}
	}

	async rawRequest(path, { payload, expectResponse = true, logLevel = 'error' } = {}) {
		const url = this.buildUrl(path)
		const cookieHeader = this.buildCookieHeader()
		const headers = {
			Origin: DEFAULT_ORIGIN,
		}
		if (cookieHeader) {
			headers.Cookie = cookieHeader
		}

		return new Promise((resolve, reject) => {
			let settled = false

			const fail = (err) => {
				if (settled) return
				settled = true

				if (err?.statusCode === 401 || err?.authFailed) {
					this.invalidateSession()
					err.authFailed = true
				}

				this.log(logLevel, `WebSocket request failed for ${path}: ${err.message}`)
				reject(err)
			}

			let timeoutHandle = null
			let handshakeCompleted = false
			const ws = new WebSocket(url, {
				handshakeTimeout: this.timeout,
				headers,
			})

			ws.on('upgrade', (res) => {
				this.updateCookiesFromResponse(res)
			})

			ws.on('unexpected-response', (_req, res) => {
				const err = new Error(`Unexpected server response: ${res.statusCode}`)
				err.statusCode = res.statusCode
				err.headers = res.headers
				fail(err)
			})

			const resolveAndClose = (value) => {
				if (settled) return
				settled = true
				clearTimeout(timeoutHandle)
				try {
					ws.close()
				} catch (closeErr) {
					// ignore close errors
				}
				resolve(value)
			}

			timeoutHandle = setTimeout(() => {
				fail(new Error('WebSocket request timed out'))
				try {
					ws.terminate()
				} catch {
					// ignore terminate errors
				}
			}, this.timeout)

			ws.on('open', () => {
				handshakeCompleted = true
				if (payload !== undefined) {
					try {
						const data = typeof payload === 'string' ? payload : JSON.stringify(payload)
						ws.send(data)
					} catch (err) {
						fail(err)
					}
				}

				if (!expectResponse) {
					resolveAndClose(null)
				}
			})

			ws.on('message', (raw) => {
				if (!expectResponse) return

				try {
					const text = raw.toString('utf8')
					const parsed = text.length ? JSON.parse(text) : null
					resolveAndClose(parsed)
				} catch (err) {
					fail(err)
				}
			})

			ws.on('error', (err) => {
				fail(err)
			})

			ws.on('close', () => {
				if (settled) return

				if (expectResponse) {
					fail(new Error('Connection closed before a response was received'))
				} else {
					resolveAndClose(null)
				}
			})
		})
	}

	async sendOrder(orderId, data) {
		if (!orderId) {
			throw new Error('orderId is required')
		}

		const payload = {
			orderID: orderId,
			data: data ?? {},
		}

		const response = await this.request('/remote/controller/postOrder', {
			payload,
			expectResponse: false,
		})
		return response
	}

	async getDeviceStatus() {
		return this.request('/remote/controller/getDeviceStatus', { logLevel: 'debug' })
	}

	async getLiveStatus() {
		return this.request('/remote/controller/getLiveStatus', { logLevel: 'debug' })
	}

	async getDirectorList() {
		return this.request('/remote/controller/getDirectorList', { logLevel: 'debug' })
	}

	async getMaterialList() {
		return this.request('/remote/controller/getMaterialList', { logLevel: 'debug' })
	}

	async getMixerList() {
		return this.request('/remote/controller/getMixerList', { logLevel: 'debug' })
	}

	async heartbeat() {
		return this.request('/remote/controller/heartbeat', { logLevel: 'debug' })
	}

	async fetchSceneImage(params = {}) {
		const query = new URLSearchParams()
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null) {
				query.append(key, value)
			}
		}

		const url = this.buildHttpUrl(`/remote/controller/images/scenes?${query.toString()}`)

		return new Promise((resolve, reject) => {
			const request = (url.startsWith('https') ? https : http).get(
				url,
				{
					agent: this.httpAgent,
					timeout: this.timeout,
					headers: {
						Accept: 'image/jpeg,image/png,*/*',
					},
				},
				(res) => {
					if (res.statusCode !== 200) {
						res.resume()
						reject(new Error(`Unexpected status ${res.statusCode} fetching scene image`))
						return
					}

					const chunks = []
					res.on('data', (chunk) => chunks.push(chunk))
					res.on('end', () => resolve(Buffer.concat(chunks)))
				},
			)

			request.on('error', reject)
			request.on('timeout', () => {
				request.destroy(new Error('Scene image request timed out'))
			})
		})
	}
}

module.exports = {
	YoloboxClient,
}
