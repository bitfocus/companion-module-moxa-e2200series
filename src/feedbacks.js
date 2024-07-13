import { choices, cmd, feedbackOptions, fb_styles } from './consts.js'

export async function UpdateFeedbacks (self) {
	let feedbackDefs = []
	const doOption = {
		...feedbackOptions.do,
		default: self.moxa.outputs[0].id,
		choices: self.moxa.outputs,
	}
	
	feedbackDefs['do_status'] = {
		name: 'DO Status',
		type: 'boolean',
		defaultStyle: fb_styles.defaultRed,
		options: [doOption],
		callback: async (feedback) => {
			return self.moxa.do[feedback.options.do].status
		},
		subscribe: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.status, options.do, cmd.char.query))
		},
	}
	feedbackDefs['do_mode'] = {
		name: 'DO Mode',
		type: 'boolean',
		defaultStyle: fb_styles.defaultRed,
		options: [doOption, feedbackOptions.doMode],
		callback: async (feedback) => {
			return self.moxa.do[feedback.options.do].mode === feedback.options.mode
		},
		subscribe: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.mode, options.do, cmd.char.query))
		}
	}
	feedbackDefs['do_pulse'] = {
		name: 'DO Pulse',
		type: 'boolean',
		defaultStyle: fb_styles.defaultRed,
		options: [doOption],
		callback: async (feedback) => {
			return self.moxa.do[feedback.options.do].pulseStart
		},
		subscribe: async ({ options }) => {
			await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.do.pulseStart, options.do, cmd.char.query))
		}
	}
	if (self.config.model !== choices.device[4].id && self.config.model !== choices.device[5].id) {
		const diOption = {
			...feedbackOptions.di,
			default: self.moxa.inputs[0].id,
			choices: self.moxa.inputs,
		}
		feedbackDefs['di_status'] = {
			name: 'DI Status',
			type: 'boolean',
			defaultStyle: fb_styles.defaultRed,
			options: [diOption],
			callback: async (feedback) => {
				return self.moxa.di[feedback.options.di].status
			},
			subscribe: async ({ options }) => {
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.status, options.di, cmd.char.query))
			}
		}
		feedbackDefs['di_cntStart'] = {
			name: 'DI Counter',
			type: 'boolean',
			defaultStyle: fb_styles.defaultRed,
			options: [diOption],
			callback: async (feedback) => {
				return self.moxa.di[feedback.options.di].cntStart
			},
			subscribe: async ({ options }) => {
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.countStart, options.di, cmd.char.query))
			}
		}
		feedbackDefs['di_mode'] = {
			name: 'DI Mode',
			type: 'boolean',
			defaultStyle: fb_styles.defaultRed,
			options: [diOption, feedbackOptions.diMode],
			callback: async (feedback) => {
				return self.moxa.di[feedback.options.di].mode === feedback.options.mode
			},
			subscribe: async ({ options }) => {
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.mode, options.di, cmd.char.query))
			}
		}
		feedbackDefs['di_trigger'] = {
			name: 'DI Trigger',
			type: 'boolean',
			defaultStyle: fb_styles.defaultRed,
			options: [diOption, feedbackOptions.diTrigger],
			callback: async (feedback) => {
				return self.moxa.di[feedback.options.di].mode === feedback.options.mode
			},
			subscribe: async ({ options }) => {
				await self.sendMsg(self.buildMsg(cmd.get.path, cmd.get.di.trigger, options.di, cmd.char.query))
			}
		}
	}
	self.setFeedbackDefinitions(feedbackDefs)
}
