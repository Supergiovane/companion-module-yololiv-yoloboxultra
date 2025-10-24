const { combineRgb } = require('@companion-module/base')

module.exports = function (self) {
	const directorChoices = self.buildDirectorChoices()
	const overlayChoices = self.buildOverlayChoices()

	self.setFeedbackDefinitions({
		program_source: {
			type: 'boolean',
			name: 'Program source is active',
			description: 'Change button style when the selected source is on program.',
			options: [
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					minChoicesForSearch: 0,
					choices: directorChoices,
					default: directorChoices[0]?.id,
				},
			],
			defaultStyle: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 128, 255),
			},
			callback: (feedback) => {
				const targetId = feedback.options.source
				if (!targetId) return false
				return self.getActiveDirectorId() === targetId
			},
		},
		overlay_active: {
			type: 'boolean',
			name: 'Overlay is active',
			description: 'Highlights the button when the overlay is enabled.',
			options: [
				{
					type: 'dropdown',
					label: 'Overlay',
					id: 'overlay',
					minChoicesForSearch: 0,
					choices: overlayChoices,
					default: overlayChoices[0]?.id,
				},
			],
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(0, 255, 128),
			},
			callback: (feedback) => {
				const overlayId = feedback.options.overlay
				if (!overlayId) return false

				return self.getOverlayState(overlayId) === true
			},
		},
		live_status: {
			type: 'boolean',
			name: 'Streaming live status',
			description: 'Changes button style based on the current live state.',
			options: [
				{
					type: 'dropdown',
					id: 'state',
					label: 'Match state',
					default: 'live',
					choices: [
						{ id: 'live', label: 'Live' },
						{ id: 'offline', label: 'Offline' },
					],
				},
			],
			defaultStyle: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(200, 0, 0),
			},
			callback: (feedback) => {
				const desired = feedback.options.state || 'live'
				const isLive = Boolean(self.liveStatus?.living)
				return desired === 'live' ? isLive : !isLive
			},
		},
	})
}
