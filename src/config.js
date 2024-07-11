import { Regex } from '@companion-module/base'
import { default_port, choices } from './consts.js'

// Return config fields for web config
export function getConfigFields() {
	return [
		{
			type: 'dropdown',
			id: 'model',
			label: 'Model',
			witdth: 6,
			default: choices.device[0].id,
			allowCustom: false,
			choices: choices.device,
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Hostname',
			width: 12,
			regex: Regex.HOSTNAME,
		},
		{
			type: 'number',
			id: 'pollInterval',
			label: 'Poll Rate (s)',
			width: 6,
			default: 2,
			min: 0,
			max: 60,
			range: true,
			step: 0.5,
			tooltip: `Poll rate. Set to 0 to turn off`,
		},
        {
			type: 'checkbox',
			id: 'verbose',
			label: 'Verbose Logs',
			width: 6,
			default: false,
		},
	]
}
