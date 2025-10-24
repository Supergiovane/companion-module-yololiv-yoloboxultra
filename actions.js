module.exports = function (self) {
	const directorChoices = self.buildDirectorChoices()
	const overlayChoices = self.buildOverlayChoices()
	const mixerChoices = self.buildMixerChoices()

	self.setActionDefinitions({
		switch_program_source: {
			name: 'Switch program source',
			options: [
				{
					type: 'dropdown',
					id: 'source',
					label: 'Source',
					choices: directorChoices,
					minChoicesForSearch: 0,
					default: directorChoices[0]?.id,
				},
			],
			callback: async (event) => {
				const sourceId = event.options.source
				if (!sourceId) throw new Error('No source selected')

				await self.sendOrder('order_director_change', {
					id: sourceId,
					isSelected: true,
				})
			},
		},
		set_overlay_state: {
			name: 'Overlay: set state',
			options: [
				{
					type: 'dropdown',
					id: 'overlay',
					label: 'Overlay',
					choices: overlayChoices,
					minChoicesForSearch: 0,
					default: overlayChoices[0]?.id,
				},
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Mode',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Enable overlay' },
						{ id: 'off', label: 'Disable overlay' },
						{ id: 'toggle', label: 'Toggle overlay' },
					],
				},
			],
			callback: async (event) => {
				const overlayId = event.options.overlay
				if (!overlayId) throw new Error('No overlay selected')

				let desiredState
				if (event.options.mode === 'toggle') {
					const current = self.getOverlayState(overlayId)
					if (current === null) {
						throw new Error('Unable to determine current overlay state')
					}
					desiredState = !current
				} else {
					desiredState = event.options.mode === 'on'
				}

				await self.sendOrder('order_material_change', {
					id: overlayId,
					isSelected: desiredState,
				})
			},
		},
		configure_audio_channel: {
			name: 'Audio: configure channel',
			options: [
				{
					type: 'dropdown',
					id: 'mixer',
					label: 'Channel',
					choices: mixerChoices,
					minChoicesForSearch: 0,
					default: mixerChoices[0]?.id,
				},
				{
					type: 'checkbox',
					id: 'applyVolume',
					label: 'Adjust volume',
					default: false,
				},
				{
					type: 'number',
					id: 'volume',
					label: 'Volume (0-100)',
					width: 4,
					min: 0,
					max: 100,
					default: 70,
				},
				{
					type: 'dropdown',
					id: 'channelState',
					label: 'Channel on/off',
					default: 'nochange',
					choices: [
						{ id: 'nochange', label: 'Leave unchanged' },
						{ id: 'on', label: 'Turn on' },
						{ id: 'off', label: 'Turn off' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
				{
					type: 'dropdown',
					id: 'afv',
					label: 'Audio follows video',
					default: 'nochange',
					choices: [
						{ id: 'nochange', label: 'Leave unchanged' },
						{ id: 'on', label: 'Enable AFV' },
						{ id: 'off', label: 'Disable AFV' },
						{ id: 'toggle', label: 'Toggle AFV' },
					],
				},
			],
			callback: async (event) => {
				const mixerId = event.options.mixer
				if (!mixerId) throw new Error('No audio channel selected')

				const payload = {
					id: mixerId,
				}

				if (event.options.applyVolume) {
					const volumePercent = Number(event.options.volume)
					if (Number.isNaN(volumePercent)) throw new Error('Invalid volume value')
					const scaled = Math.max(0, Math.min(100, volumePercent)) / 100
					payload.volume = Number(scaled.toFixed(3))
				}

				const currentMixer = self.getMixerState(mixerId)

				if (event.options.channelState !== 'nochange') {
					if (event.options.channelState === 'toggle') {
						if (!currentMixer || typeof currentMixer.isSelected !== 'boolean') {
							throw new Error('Unable to determine current channel state')
						}
						payload.isSelected = !currentMixer.isSelected
					} else {
						payload.isSelected = event.options.channelState === 'on'
					}
				}

				if (event.options.afv !== 'nochange') {
					if (event.options.afv === 'toggle') {
						if (!currentMixer || typeof currentMixer.AFV !== 'boolean') {
							throw new Error('Unable to determine current AFV state')
						}
						payload.AFV = !currentMixer.AFV
					} else {
						payload.AFV = event.options.afv === 'on'
					}
				}

				await self.sendOrder('order_mixer_change', payload)
			},
		},
		set_live_status: {
			name: 'Go live / stop streaming',
			options: [
				{
					type: 'dropdown',
					id: 'state',
					label: 'Desired state',
					default: 'start',
					choices: [
						{ id: 'start', label: 'Start live' },
						{ id: 'stop', label: 'Stop live' },
						{ id: 'toggle', label: 'Toggle live' },
					],
				},
			],
			callback: async (event) => {
				let targetState = event.options.state

				if (targetState === 'toggle') {
					const currentlyLive = Boolean(self.liveStatus?.living)
					targetState = currentlyLive ? 'stop' : 'start'
				}

				await self.sendOrder('order_live_status', {
					status: targetState,
				})
			},
		},
		set_active_tab: {
			name: 'Change active tab on device',
			options: [
				{
					type: 'number',
					id: 'tabId',
					label: 'Tab ID (integer)',
					default: 0,
					min: 0,
					max: 10,
				},
			],
			callback: async (event) => {
				const tabId = Number(event.options.tabId)
				if (Number.isNaN(tabId)) throw new Error('Invalid tab id')

				await self.sendOrder('order_tab_change', {
					id: tabId,
				})
			},
		},
		refresh_state: {
			name: 'Refresh cached status',
			options: [],
			callback: async () => {
				await self.refreshAllData(true)
			},
		},
	})
}
