const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const { YoloboxClient } = require('./lib/yolobox-client')

const DEFAULT_PORT = 8887
const POLL_INTERVAL = 5000

class YoloboxUltraInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.client = null
		this.pollTimer = null
		this.pollInFlight = false

		this.deviceStatus = null
		this.liveStatus = null
		this.directorList = []
		this.overlayList = []
		this.mixerList = []
	}

	async init(config) {
		this.config = config

		this.updateStatus(InstanceStatus.Connecting)
		this.setupClient()

		this.updateVariableDefinitions()

		await this.refreshAllData(true)

		this.updateActions()
		this.updateFeedbacks()

		this.startPolling()
	}

	async destroy() {
		this.stopPolling()
		this.log('debug', 'Yolobox Ultra module destroyed')
	}

	async configUpdated(config) {
		this.config = config
		this.stopPolling()
		this.updateStatus(InstanceStatus.Connecting)
		this.setupClient()
		await this.refreshAllData(true)
		this.startPolling()
	}

	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'YoloBox Ultra IP address',
				width: 8,
				regex: Regex.IP,
			},
			{
				type: 'number',
				id: 'port',
				label: 'WebSocket port',
				width: 4,
				default: DEFAULT_PORT,
				min: 1,
				max: 65535,
			},
			{
				type: 'number',
				id: 'pollInterval',
				label: 'Status polling interval (ms)',
				width: 4,
				default: POLL_INTERVAL,
				min: 1000,
				max: 60000,
			},
		]
	}

	setupClient() {
		const host = this.config?.host?.trim()
		const port = this.config?.port ? Number(this.config.port) : DEFAULT_PORT

		if (!host) {
			this.client = null
			this.updateStatus(InstanceStatus.BadConfig, 'IP address required')
			return
		}

		if (!this.client) {
			this.client = new YoloboxClient(this.log.bind(this), host, port)
		} else {
			this.client.setEndpoint(host, port)
		}
	}

	startPolling() {
		const interval = Number(this.config?.pollInterval) || POLL_INTERVAL

		this.stopPolling()

		this.pollTimer = setInterval(() => {
			void this.refreshAllData(false)
		}, interval)
	}

	stopPolling() {
		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = null
		}
	}

	async refreshAllData(isInitial) {
		if (!this.client) {
			return
		}

		if (this.pollInFlight) {
			return
		}

		this.pollInFlight = true

		try {
			await this.client.ensureAuthenticated()

			const deviceStatus = await this.client.getDeviceStatus().catch((err) => {
				this.log('debug', `Unable to read device status: ${err.message}`)
				return null
			})

			const liveStatus = await this.client.getLiveStatus().catch((err) => {
				this.log('debug', `Unable to read live status: ${err.message}`)
				return null
			})

			const directors = await this.client.getDirectorList().catch((err) => {
				this.log('debug', `Unable to read director list: ${err.message}`)
				return null
			})

			const overlays = await this.client.getMaterialList().catch((err) => {
				this.log('debug', `Unable to read overlay list: ${err.message}`)
				return null
			})

			const mixers = await this.client.getMixerList().catch((err) => {
				this.log('debug', `Unable to read mixer list: ${err.message}`)
				return null
			})

			const connectionSuccessful = Boolean(deviceStatus || directors || overlays || mixers)

			if (connectionSuccessful) {
				this.updateStatus(InstanceStatus.Ok)
			} else if (isInitial) {
				this.updateStatus(InstanceStatus.ConnectionFailure, 'No response from YoloBox Ultra')
			}

			if (deviceStatus?.data) {
				this.deviceStatus = deviceStatus.data
				this.applyDeviceVariables()
			}

			if (liveStatus?.data?.result) {
				this.liveStatus = liveStatus.data.result
				this.applyLiveVariables()
			}

			if (directors?.data?.result) {
				this.directorList = directors.data.result
			}

			if (overlays?.data?.result) {
				this.overlayList = overlays.data.result
			}

			if (mixers?.data?.result) {
				this.mixerList = mixers.data.result
			}

			if (directors?.data?.result || overlays?.data?.result || mixers?.data?.result) {
				this.updateActions()
				this.updateFeedbacks()
			}

			this.updateFeedbackStates()
		} catch (err) {
			if (err?.authFailed) {
				this.updateStatus(InstanceStatus.AuthenticationFailure, 'Authentication failed')
				this.log('error', 'Failed to authenticate with YoloBox Ultra')
			} else {
				this.updateStatus(InstanceStatus.UnknownError, err.message)
				this.log('error', `Failed to refresh data: ${err.message}`)
			}
		} finally {
			this.pollInFlight = false
		}
	}

	applyDeviceVariables() {
		if (!this.deviceStatus) return

		const variables = {
			battery: `${this.deviceStatus.battery ?? ''}`,
			bitrate: this.deviceStatus.bitrate ?? '',
			cpu: this.deviceStatus.cpu ?? '',
			device_name: this.deviceStatus.deviceName ?? '',
			firmware_version: this.deviceStatus.firmwareVersion ?? '',
			fps: this.deviceStatus.fps ?? '',
			memory: this.deviceStatus.memory ?? '',
			serial: this.deviceStatus.serialNumber ?? '',
			software_version: this.deviceStatus.softwareVersion ?? '',
			temperature: this.deviceStatus.temperature ?? '',
			uptime: this.deviceStatus.upTime ?? '',
			wifi_ssid: this.deviceStatus.wifi?.ssid ?? '',
			wifi_ipv4: this.deviceStatus.wifi?.ipv4Address ?? '',
		}

		this.setVariableValues(variables)
	}

	applyLiveVariables() {
		if (!this.liveStatus) return

		const variables = {
			is_live: this.liveStatus.living ? '1' : '0',
			live_since: this.liveStatus.startTime ? new Date(this.liveStatus.startTime).toISOString() : '',
		}

		this.setVariableValues(variables)
	}

	buildDirectorChoices() {
		if (!Array.isArray(this.directorList) || this.directorList.length === 0) {
			return []
		}

		return this.directorList.map((item) => ({
			id: item.id,
			label: item.directorName || item.id,
		}))
	}

	buildOverlayChoices() {
		if (!Array.isArray(this.overlayList) || this.overlayList.length === 0) {
			return []
		}

		return this.overlayList.map((item) => ({
			id: item.id,
			label: item.id,
		}))
	}

	buildMixerChoices() {
		if (!Array.isArray(this.mixerList) || this.mixerList.length === 0) {
			return []
		}

		return this.mixerList.map((item) => ({
			id: item.id || item.mixerName,
			label: item.mixerName || item.id,
		}))
	}

	getActiveDirectorId() {
		const active = this.directorList.find((item) => item.isSelected)
		return active ? active.id : null
	}

	getOverlayState(overlayId) {
		const entry = this.overlayList.find((item) => item.id === overlayId)
		return entry ? Boolean(entry.isSelected) : null
	}

	getMixerState(mixerId) {
		return this.mixerList.find((item) => (item.id || item.mixerName) === mixerId) || null
	}

	async sendOrder(orderId, data) {
		if (!this.client) {
			throw new Error('YoloBox client is not ready')
		}

		const response = await this.client.sendOrder(orderId, data)

		// refresh to keep state in sync
		void this.refreshAllData(false)

		return response
	}

	updateFeedbackStates() {
		this.checkFeedbacks('program_source')
		this.checkFeedbacks('overlay_active')
		this.checkFeedbacks('live_status')
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}
}

runEntrypoint(YoloboxUltraInstance, UpgradeScripts)
