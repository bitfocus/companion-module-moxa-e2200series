import type { CompanionVariableDefinitions } from '@companion-module/base'
import type MoxaE2200Instance from './main.js'
import type { InfoVariable } from './protocol.js'

/** The per channel ids are the ones the module has always used, so they stay as they are */
export type VariablesSchema = { [K in InfoVariable]: string } & {
	[id: `count_input_${number}`]: number
	[id: `filter_input_${number}`]: number
	[id: `lowWidth_output_${number}`]: number
	[id: `highWidth_output_${number}`]: number
}

export function UpdateVariableDefinitions(self: MoxaE2200Instance): void {
	const variables: CompanionVariableDefinitions<VariablesSchema> = {
		date: { name: 'Date' },
		time: { name: 'Time' },
		location: { name: 'Location' },
		description: { name: 'Description' },
		firmware: { name: 'Firmware Version' },
		model: { name: 'Model Name' },
		serial: { name: 'Serial Number' },
		macAddr: { name: 'MAC Address' },
		IP: { name: 'IP Address' },
	}
	for (let i = 0; i < self.state.inputs.length; i++) {
		variables[`count_input_${i}`] = { name: `DI: Counter ${i}` }
		variables[`filter_input_${i}`] = { name: `DI: Filter ${i}` }
	}
	for (let i = 0; i < self.state.outputs.length; i++) {
		variables[`lowWidth_output_${i}`] = { name: `DO: Pulse Low Width ${i}` }
		variables[`highWidth_output_${i}`] = { name: `DO: Pulse High Width ${i}` }
	}
	self.setVariableDefinitions(variables)
}
