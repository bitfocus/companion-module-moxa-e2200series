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
			type: 'textinput',
			id: 'port',
			label: 'Port',
			width: 6,
			regex: Regex.PORT,
			default: default_port,
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
			step: 1,
			tooltip: `Poll rate. Set to 0 to turn off`,
		},
        {
            type: 'multidropdown',
            id: 'counter_e2210',
            label: 'Counter Inputs',
            width: 6,
            choices: choices.e2210inputs,
            default: [],
            minSelection: 0,
            tooltip: 'Select Inputs configured for counter mode',
            isVisible: (options) => {
				return options.model === choices.device[0].id
			},
        },
        {
            type: 'multidropdown',
            id: 'counter_e2212',
            label: 'Counter Inputs',
            width: 6,
            choices: choices.e2212inputs,
            default: [],
            minSelection: 0,
            tooltip: 'Select Inputs configured for counter mode',
            isVisible: (options) => {
				return options.model === choices.device[1].id
			},
        },
        {
            type: 'multidropdown',
            id: 'pulse_e2210',
            label: 'Pulse Outputs',
            width: 6,
            choices: choices.e2210outputs,
            default: [],
            minSelection: 0,
            tooltip: 'Select Outputs configured for pulse mode',
            isVisible: (options) => {
				return options.model === choices.device[0].id
			},
        },
        {
            type: 'multidropdown',
            id: 'pulse_e2212',
            label: 'Pulse Outputs',
            width: 6,
            choices: choices.e2212outputs,
            default: [],
            minSelection: 0,
            tooltip: 'Select Outputs configured for pulse mode',
            isVisible: (options) => {
				return options.model === choices.device[1].id
			},
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
