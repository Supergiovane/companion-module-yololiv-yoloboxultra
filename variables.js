module.exports = function (self) {
	self.setVariableDefinitions([
		{ variableId: 'battery', name: 'Battery (%)' },
		{ variableId: 'bitrate', name: 'Bitrate' },
		{ variableId: 'cpu', name: 'CPU usage' },
		{ variableId: 'device_name', name: 'Device name' },
		{ variableId: 'firmware_version', name: 'Firmware version' },
		{ variableId: 'fps', name: 'Frames per second' },
		{ variableId: 'memory', name: 'Memory usage' },
		{ variableId: 'serial', name: 'Serial number' },
		{ variableId: 'software_version', name: 'Software version' },
		{ variableId: 'temperature', name: 'Temperature (°C)' },
		{ variableId: 'uptime', name: 'Uptime' },
		{ variableId: 'wifi_ssid', name: 'Wi-Fi SSID' },
		{ variableId: 'wifi_ipv4', name: 'Wi-Fi IPv4 address' },
		{ variableId: 'is_live', name: 'Live status (1/0)' },
		{ variableId: 'live_since', name: 'Live since (ISO timestamp)' },
	])
}
