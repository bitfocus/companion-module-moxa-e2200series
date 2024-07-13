import { cmd, actionOptions} from './consts.js'

export async function UpdateActions (self) {
	let actionDefs = []
	const doOption = {
		...actionOptions.do,
		default: self.moxa.outputsDigital[0].id,
		choices: self.moxa.outputsDigital,
	}
	actionDefs['set_DO_status'] = {
		name: 'Set DO Status',
		options: [doOption, actionOptions.doStatus],
		callback: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.do.status, options.do, options.status))
		},
		subscribe: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.status, options.do, cmd.char.query))
		},
	}
	actionDefs['get_DO_status'] = {
		name: 'Get DO Status',
		options: [],
		callback: async () => {
			const outputs = Object.keys(self.moxa.outputsDigital)
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.status, outputs, cmd.char.query))
		},
		subscribe: async () => {
			const outputs = Object.keys(self.moxa.outputsDigital)
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.status, outputs, cmd.char.query))
		},
	}
	actionDefs['set_DO_mode'] = {
		name: 'Set DO Mode',
		options: [doOption, actionOptions.doMode],
		callback: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.do.mode, options.do, options.mode))
		},
		subscribe: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.mode, options.do, cmd.char.query))
		},
	}
	actionDefs['get_DO_mode'] = {
		name: 'Get DO Mode',
		options: [],
		callback: async () => {
			const outputs = Object.keys(self.moxa.outputsDigital)
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.mode, outputs, cmd.char.query))
		},
		subscribe: async () => {
			const outputs = Object.keys(self.moxa.outputsDigital)
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.mode, outputs, cmd.char.query))
		},
	}
	actionDefs['set_DO_pulseStart'] = {
		name: 'Set DO Pulse',
		options: [doOption, actionOptions.doPulseStart],
		callback: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.do.pulseStart, options.do, options.mode))
		},
		subscribe: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.pulseStart, options.do, cmd.char.query))
		},
	}
	actionDefs['get_DO_pulseStart'] = {
		name: 'Get DO Pulse',
		options: [],
		callback: async () => {
			const outputs = Object.keys(self.moxa.outputsDigital)
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.pulseStart, outputs, cmd.char.query))
		},
		subscribe: async () => {
			const outputs = Object.keys(self.moxa.outputsDigital)
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.pulseStart, outputs, cmd.char.query))
		},
	}
	actionDefs['set_DO_lowWidth'] = {
		name: 'Set DO Pulse Low Width',
		options: [doOption, actionOptions.doLowWidth],
		callback: async ({ options }) => {
			let width = Math.number(await self.parseVariablesInString(options.lowWidth))
			if (isNaN(width) || width < 0.5 || width > 32767) {
				self.log('warn', `set_DO_lowWidth has been passed an out of range param ${width}`)
				return undefined
			}
			width = parseInt(width * 2)
			await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.do.lowWidth, options.do, width))
		},
		subscribe: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.lowWidth, options.do, cmd.char.query))
		},
	}
	actionDefs['set_DO_highWidth'] = {
		name: 'Set DO Pulse High Width',
		options: [doOption, actionOptions.doHighWidth],
		callback: async ({ options }) => {
			let width = Math.number(await self.parseVariablesInString(options.highWidth))
			if (isNaN(width) || width < 0.5 || width > 32767) {
				self.log('warn', `set_DO_highWidth has been passed an out of range param ${width}`)
				return undefined
			}
			width = parseInt(width * 2)
			await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.do.highWidth, options.do, width))
		},
		subscribe: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.highWidth, options.do, cmd.char.query))
		},
	}
	actionDefs['get_DO_pulseWidth'] = {
		name: 'Get DO Pulse Width',
		options: [],
		callback: async () => {
			const outputs = Object.keys(self.moxa.outputsDigital)
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.set.do.lowWidth, outputs, cmd.char.query))
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.set.do.highWidth, outputs, cmd.char.query))
		},
		subscribe: async () => {
			const outputs = Object.keys(self.moxa.outputsDigital)
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.set.do.lowWidth, outputs, cmd.char.query))
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.highWidth, outputs, cmd.char.query))
		},
	}
	if (self.moxa.di.length > 0) {
		const diOption = {
			...actionOptions.di,
			default: self.moxa.inputsDigital[0].id,
			choices: self.moxa.inputsDigital,
		}
		actionDefs['set_DI_mode'] = {
			name: 'Set DI Mode',
			options: [diOption, actionOptions.diMode],
			callback: async ({ options }) => {
				await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.di.mode, options.di, options.mode))
			},
			subscribe: async ({ options }) => {
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.mode, options.di, cmd.char.query))
			},
		}
		actionDefs['get_DI_mode'] = {
			name: 'Get DI Mode',
			options: [],
			callback: async () => {
				const inputs = Object.keys(self.moxa.inputsDigital)
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.mode, inputs, cmd.char.query))
			},
			subscribe: async () => {
				const inputs = Object.keys(self.moxa.inputsDigital)
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.mode, inputs, cmd.char.query))
			},
		}
		actionDefs['set_DI_trigger'] = {
			name: 'Set DI Trigger',
			options: [diOption, actionOptions.diTrigger],
			callback: async ({ options }) => {
				await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.di.trigger, options.di, options.mode))
			},
			subscribe: async ({ options }) => {
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.trigger, options.di, cmd.char.query))
			},
		}
		actionDefs['get_DI_trigger'] = {
			name: 'Get DI Trigger',
			options: [],
			callback: async () => {
				const inputs = Object.keys(self.moxa.inputsDigital)
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.trigger, inputs, cmd.char.query))
			},
			subscribe: async () => {
				const inputs = Object.keys(self.moxa.inputsDigital)
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.trigger, inputs, cmd.char.query))
			},
		}
		actionDefs['set_DI_CNT_start'] = {
			name: 'Set DI Count Start',
			options: [diOption, actionOptions.diCntStart],
			callback: async ({ options }) => {
				await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.di.countStart, options.di, options.mode))
			},
			subscribe: async ({ options }) => {
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.countStart, options.di, cmd.char.query))
			},
		}
		actionDefs['set_DI_filter'] = {
			name: 'Set DI Filter',
			options: [diOption, actionOptions.diFilter],
			callback: async ({ options }) => {
				let filter = Math.number(await self.parseVariablesInString(options.filter))
				if (isNaN(filter) || filter < 0.5 || filter > 8480) {
					self.log('warn', `set_DI_filter has been passed an out of range param ${filter}`)
					return undefined
				}
				filter = parseInt(filter * 2)
				await self.sendMsg(self.buildMsg(cmd.set.path, cmd.set.di.filter, options.di, filter))
			},
			subscribe: async ({ options }) => {
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.filter, options.di, cmd.char.query))
			},
		}
		actionDefs['get_DI_filter'] = {
			name: 'Get DI Filter',
			options: [],
			callback: async () => {
				const inputs = Object.keys(self.moxa.inputsDigital)
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.filter, inputs, cmd.char.query))
			},
			subscribe: async () => {
				const inputs = Object.keys(self.moxa.inputsDigital)
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.filter, inputs, cmd.char.query))
			},
		}
		actionDefs['get_DI_count'] = {
			name: 'Get DI Count',
			options: [],
			callback: async () => {
				const inputs = Object.keys(self.moxa.inputsDigital)
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.count, inputs, cmd.char.query))
			},
			subscribe: async () => {
				const inputs = Object.keys(self.moxa.inputsDigital)
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.count, inputs, cmd.char.query))
			},
		}
	}
	self.setActionDefinitions(actionDefs)
}
