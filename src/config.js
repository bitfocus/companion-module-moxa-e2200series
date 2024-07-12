import { Regex } from '@companion-module/base'
import { choices } from './consts.js'

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
			default: 5,
			min: 0,
			max: 120,
			range: true,
			step: 0.5,
			tooltip: `Poll rate. Set to 0 to turn off`,
		},
		{
			type: 'multidropdown',
			id: 'poll',
			label: 'Poll Data',
			witdth: 6,
			default: [choices.polling[0].id, choices.polling[2].id],
			choices: choices.polling,
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
