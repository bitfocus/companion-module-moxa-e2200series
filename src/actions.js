//import { Regex } from '@companion-module/base'
import { choices, cmd, actionOptions} from './consts.js'

export async function UpdateActions (self) {
	const doOption = {
		...actionOptions.do,
		default: self.moxa.outputs[0].id,
		choices: self.moxa.outputs,
	}
	const diOption = {
		...actionOptions.di,
		default: self.moxa.inputs[0].id,
		choices: self.moxa.inputs,
	}
	let actionDefs = []
	actionDefs['set_DO_status'] = {
		name: 'Set DO Status',
		options: [doOption, actionOptions.doStatus],
		callback: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.do.status, options.do, options.status))
		},
		subscribe: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.status, options.do, '?'))
		},
	}
	actionDefs['set_DO_mode'] = {
		name: 'Set DO Mode',
		options: [doOption, actionOptions.doMode],
		callback: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.do.mode, options.do, options.mode))
		},
		subscribe: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.mode, options.do, '?'))
		},
	}
	actionDefs['set_DO_pulseStart'] = {
		name: 'Set DO Pulse',
		options: [doOption, actionOptions.doPulseStart],
		callback: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.do.pulseStart, options.do, options.mode))
		},
		subscribe: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.pulseStart, options.do, '?'))
		},
	}
	actionDefs['set_DI_mode'] = {
		name: 'Set DI Mode',
		options: [diOption, actionOptions.diMode],
		callback: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.di.mode, options.di, options.mode))
		},
		subscribe: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.mode, options.di, '?'))
		},
	}
	actionDefs['set_DI_trigger'] = {
		name: 'Set DI Trigger',
		options: [diOption, actionOptions.diTrigger],
		callback: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.di.trigger, options.di, options.mode))
		},
		subscribe: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.trigger, options.di, '?'))
		},
	}
	actionDefs['set_DI_CNT_start'] = {
		name: 'Set DI Count Start',
		options: [diOption, actionOptions.diCntStart],
		callback: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.di.countStart, options.di, options.mode))
		},
		subscribe: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.countStart, options.di, '?'))
		},
	}
	actionDefs['set_DI_filter'] = {
		name: 'Set DI Filter',
		options: [diOption, actionOptions.diFilter],
		callback: async ({ options }) => {
			let filter = number(await self.parseVariablesInString(options.filter))
			if (isNaN(filter) || filter < 0.5 || filter > 8480) {
				self.log('warn', `set_DI_filter has been passed an out of range param ${filter}`)
				return undefined
			}
			filter = parseInt(filter * 2)
			await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.di.filter, options.di, filter))
		},
		subscribe: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.filter, options.di, '?'))
		},
	}
	self.setActionDefinitions(actionDefs)
}
