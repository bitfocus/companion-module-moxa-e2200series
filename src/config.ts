import type { SomeCompanionConfigField } from '@companion-module/base'
import { MODEL_CHOICES, POLL_CHOICES, PollData, type Model } from './consts.js'

// A type alias, not an interface: InstanceTypes requires config to satisfy JsonObject, and interfaces don't
export type ModuleConfig = {
	model: Model
	host: string
	/** Seconds between polls. 0 turns polling off */
	pollInterval: number
	poll: PollData[]
	verbose: boolean
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'dropdown',
			id: 'model',
			label: 'Model',
			width: 6,
			default: MODEL_CHOICES[0].id,
			allowCustom: false,
			choices: MODEL_CHOICES,
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Hostname',
			width: 12,
			minLength: 1,
		},
		{
			type: 'number',
			id: 'pollInterval',
			label: 'Poll Rate (s)',
			width: 6,
			default: 5,
			min: 0,
			max: 600,
			range: true,
			step: 0.5,
			tooltip: `Set to 0 to turn off`,
		},
		{
			type: 'multidropdown',
			id: 'poll',
			label: 'Poll Data',
			width: 6,
			default: [PollData.DiStatus, PollData.DoStatus],
			choices: POLL_CHOICES,
			tooltip: 'Date & Time always polled',
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

/** The data to poll. A saved config isn't checked against its field */
export function pollData(config: ModuleConfig): PollData[] {
	const poll: unknown = config.poll
	return Array.isArray(poll) ? poll.filter((id): id is PollData => POLL_CHOICES.some((choice) => choice.id === id)) : []
}
