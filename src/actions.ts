import type { CompanionActionDefinitions, CompanionInputFieldNumber, JsonValue } from '@companion-module/base'
import type MoxaE2200Instance from './main.js'
import {
	channelChoices,
	channelIds,
	DI_MODE_CHOICES,
	DI_TRIGGER_CHOICES,
	DO_MODE_CHOICES,
	FILTER_MAX,
	FILTER_MIN,
	ON_OFF_CHOICES,
	PULSE_WIDTH_MAX,
	PULSE_WIDTH_MIN,
	START_STOP_CHOICES,
} from './consts.js'
import { channelsValue, choiceOption, choiceValue, halfMsValue, inputsOption, outputsOption } from './options.js'
import { DiParam, DoParam, getChannels, setChannels } from './protocol.js'

/**
 * Action ids. The values are the ids saved against every button using the action, so they must never change. They
 * predate this enum, which is why they are not all snake_case.
 */
export enum ActionId {
	SetDoStatus = 'set_DO_status',
	GetDoStatus = 'get_DO_status',
	SetDoMode = 'set_DO_mode',
	GetDoMode = 'get_DO_mode',
	SetDoPulseStart = 'set_DO_pulseStart',
	GetDoPulseStart = 'get_DO_pulseStart',
	SetDoLowWidth = 'set_DO_lowWidth',
	SetDoHighWidth = 'set_DO_highWidth',
	GetDoPulseWidth = 'get_DO_pulseWidth',
	SetDiMode = 'set_DI_mode',
	GetDiMode = 'get_DI_mode',
	SetDiTrigger = 'set_DI_trigger',
	GetDiTrigger = 'get_DI_trigger',
	SetDiCntStart = 'set_DI_CNT_start',
	SetDiFilter = 'set_DI_filter',
	GetDiFilter = 'get_DI_filter',
	GetDiCount = 'get_DI_count',
}

type NoOptions = { options: Record<string, never> }

type SetRequest = {
	/** Companion passes it as a string */
	actionId: string
	param: DiParam | DoParam
	/** The channels option */
	selected: JsonValue | undefined
	/** How many channels of this kind the model has */
	count: number
	/** The value option, as Companion passed it */
	option: JsonValue | undefined
	/** What the option means to the device, undefined if it isn't valid */
	value: number | undefined
}
type Outputs = { do: number[] }
type Inputs = { di: number[] }

// Several options are called mode whatever they hold. The ids are saved against every button, so they stay
export type ActionSchema = {
	[ActionId.SetDoStatus]: { options: Outputs & { status: number } }
	[ActionId.GetDoStatus]: NoOptions
	[ActionId.SetDoMode]: { options: Outputs & { mode: number } }
	[ActionId.GetDoMode]: NoOptions
	[ActionId.SetDoPulseStart]: { options: Outputs & { mode: number } }
	[ActionId.GetDoPulseStart]: NoOptions
	[ActionId.SetDoLowWidth]: { options: Outputs & { lowWidth: number } }
	[ActionId.SetDoHighWidth]: { options: Outputs & { highWidth: number } }
	[ActionId.GetDoPulseWidth]: NoOptions
	[ActionId.SetDiMode]: { options: Inputs & { mode: number } }
	[ActionId.GetDiMode]: NoOptions
	[ActionId.SetDiTrigger]: { options: Inputs & { mode: number } }
	[ActionId.GetDiTrigger]: NoOptions
	[ActionId.SetDiCntStart]: { options: Inputs & { mode: number } }
	[ActionId.SetDiFilter]: { options: Inputs & { filter: number } }
	[ActionId.GetDiFilter]: NoOptions
	[ActionId.GetDiCount]: NoOptions
}

function widthOption<TKey extends string>(id: TKey, label: string): CompanionInputFieldNumber<TKey> {
	return {
		id,
		type: 'number',
		label,
		default: 100,
		min: PULSE_WIDTH_MIN,
		max: PULSE_WIDTH_MAX,
		step: 0.5,
	}
}

function filterOption(): CompanionInputFieldNumber<'filter'> {
	return {
		id: 'filter',
		type: 'number',
		label: 'Filter (ms)',
		default: 50,
		min: FILTER_MIN,
		max: FILTER_MAX,
		step: 0.5,
	}
}

export function UpdateActions(self: MoxaE2200Instance): void {
	const outputCount = self.state.outputs.length
	const inputCount = self.state.inputs.length
	const allOutputs = channelIds(outputCount)
	const allInputs = channelIds(inputCount)
	const doOption = outputsOption(channelChoices(outputCount, 'Output'))
	const diOption = inputsOption(channelChoices(inputCount, 'Input'))

	/** Sets a parameter of the selected channels. Logs and sends nothing if no channel or the value is valid */
	async function set(request: SetRequest, signal: AbortSignal): Promise<void> {
		const channels = channelsValue(request.selected, request.count)
		if (channels.length === 0) {
			self.log('warn', `${request.actionId} has been passed no valid channels: ${JSON.stringify(request.selected)}`)
			return
		}
		if (request.value === undefined) {
			self.log('warn', `${request.actionId} has been passed an out of range param ${JSON.stringify(request.option)}`)
			return
		}
		await self.send(setChannels(request.param, channels, request.value), signal)
	}

	/** Asks for a parameter of the selected channels, if any are valid */
	async function get(param: DiParam | DoParam, selected: JsonValue | undefined, count: number): Promise<void> {
		const channels = channelsValue(selected, count)
		if (channels.length > 0) await self.send(getChannels(param, channels))
	}

	const di = inputCount > 0

	const actions: CompanionActionDefinitions<ActionSchema> = {
		[ActionId.SetDoStatus]: {
			name: 'Set DO Status',
			options: [doOption, choiceOption('status', 'Status', ON_OFF_CHOICES)],
			callback: async ({ actionId, options }, context) => {
				const status = choiceValue(options.status, ON_OFF_CHOICES)
				await set(
					{
						actionId,
						param: DoParam.status,
						selected: options.do,
						count: outputCount,
						option: options.status,
						value: status,
					},
					context.signal,
				)
			},
			optionsToMonitorForSubscribe: ['do'],
			subscribe: async ({ options }) => get(DoParam.status, options.do, outputCount),
		},
		[ActionId.GetDoStatus]: {
			name: 'Get DO Status',
			options: [],
			optionsToMonitorForSubscribe: [],
			callback: async (_action, context) => self.send(getChannels(DoParam.status, allOutputs), context.signal),
			subscribe: async () => self.send(getChannels(DoParam.status, allOutputs)),
		},
		[ActionId.SetDoMode]: {
			name: 'Set DO Mode',
			options: [doOption, choiceOption('mode', 'Mode', DO_MODE_CHOICES)],
			callback: async ({ actionId, options }, context) => {
				const mode = choiceValue(options.mode, DO_MODE_CHOICES)
				await set(
					{
						actionId,
						param: DoParam.mode,
						selected: options.do,
						count: outputCount,
						option: options.mode,
						value: mode,
					},
					context.signal,
				)
			},
			optionsToMonitorForSubscribe: ['do'],
			subscribe: async ({ options }) => get(DoParam.mode, options.do, outputCount),
		},
		[ActionId.GetDoMode]: {
			name: 'Get DO Mode',
			options: [],
			optionsToMonitorForSubscribe: [],
			callback: async (_action, context) => self.send(getChannels(DoParam.mode, allOutputs), context.signal),
			subscribe: async () => self.send(getChannels(DoParam.mode, allOutputs)),
		},
		[ActionId.SetDoPulseStart]: {
			name: 'Set DO Pulse',
			options: [doOption, choiceOption('mode', 'Pulse', START_STOP_CHOICES)],
			callback: async ({ actionId, options }, context) => {
				const start = choiceValue(options.mode, START_STOP_CHOICES)
				await set(
					{
						actionId,
						param: DoParam.pulseStart,
						selected: options.do,
						count: outputCount,
						option: options.mode,
						value: start,
					},
					context.signal,
				)
			},
			optionsToMonitorForSubscribe: ['do'],
			subscribe: async ({ options }) => get(DoParam.pulseStart, options.do, outputCount),
		},
		[ActionId.GetDoPulseStart]: {
			name: 'Get DO Pulse',
			options: [],
			optionsToMonitorForSubscribe: [],
			callback: async (_action, context) => self.send(getChannels(DoParam.pulseStart, allOutputs), context.signal),
			subscribe: async () => self.send(getChannels(DoParam.pulseStart, allOutputs)),
		},
		[ActionId.SetDoLowWidth]: {
			name: 'Set DO Pulse Low Width',
			options: [doOption, widthOption('lowWidth', 'Low Width (ms)')],
			callback: async ({ actionId, options }, context) => {
				const width = halfMsValue(options.lowWidth, PULSE_WIDTH_MIN, PULSE_WIDTH_MAX)
				await set(
					{
						actionId,
						param: DoParam.lowWidth,
						selected: options.do,
						count: outputCount,
						option: options.lowWidth,
						value: width,
					},
					context.signal,
				)
			},
			optionsToMonitorForSubscribe: ['do'],
			subscribe: async ({ options }) => get(DoParam.lowWidth, options.do, outputCount),
		},
		[ActionId.SetDoHighWidth]: {
			name: 'Set DO Pulse High Width',
			options: [doOption, widthOption('highWidth', 'High Width (ms)')],
			callback: async ({ actionId, options }, context) => {
				const width = halfMsValue(options.highWidth, PULSE_WIDTH_MIN, PULSE_WIDTH_MAX)
				await set(
					{
						actionId,
						param: DoParam.highWidth,
						selected: options.do,
						count: outputCount,
						option: options.highWidth,
						value: width,
					},
					context.signal,
				)
			},
			optionsToMonitorForSubscribe: ['do'],
			subscribe: async ({ options }) => get(DoParam.highWidth, options.do, outputCount),
		},
		[ActionId.GetDoPulseWidth]: {
			name: 'Get DO Pulse Width',
			options: [],
			optionsToMonitorForSubscribe: [],
			callback: async (_action, context) => {
				await self.send(getChannels(DoParam.lowWidth, allOutputs), context.signal)
				await self.send(getChannels(DoParam.highWidth, allOutputs), context.signal)
			},
			subscribe: async () => {
				await self.send(getChannels(DoParam.lowWidth, allOutputs))
				await self.send(getChannels(DoParam.highWidth, allOutputs))
			},
		},
		[ActionId.SetDiMode]: di
			? {
					name: 'Set DI Mode',
					options: [diOption, choiceOption('mode', 'Mode', DI_MODE_CHOICES)],
					callback: async ({ actionId, options }, context) => {
						const mode = choiceValue(options.mode, DI_MODE_CHOICES)
						await set(
							{
								actionId,
								param: DiParam.mode,
								selected: options.di,
								count: inputCount,
								option: options.mode,
								value: mode,
							},
							context.signal,
						)
					},
					optionsToMonitorForSubscribe: ['di'],
					subscribe: async ({ options }) => get(DiParam.mode, options.di, inputCount),
				}
			: undefined,
		[ActionId.GetDiMode]: di
			? {
					name: 'Get DI Mode',
					options: [],
					optionsToMonitorForSubscribe: [],
					callback: async (_action, context) => self.send(getChannels(DiParam.mode, allInputs), context.signal),
					subscribe: async () => self.send(getChannels(DiParam.mode, allInputs)),
				}
			: undefined,
		[ActionId.SetDiTrigger]: di
			? {
					name: 'Set DI Trigger',
					options: [diOption, choiceOption('mode', 'Trigger', DI_TRIGGER_CHOICES)],
					callback: async ({ actionId, options }, context) => {
						const trigger = choiceValue(options.mode, DI_TRIGGER_CHOICES)
						await set(
							{
								actionId,
								param: DiParam.trigger,
								selected: options.di,
								count: inputCount,
								option: options.mode,
								value: trigger,
							},
							context.signal,
						)
					},
					optionsToMonitorForSubscribe: ['di'],
					subscribe: async ({ options }) => get(DiParam.trigger, options.di, inputCount),
				}
			: undefined,
		[ActionId.GetDiTrigger]: di
			? {
					name: 'Get DI Trigger',
					options: [],
					optionsToMonitorForSubscribe: [],
					callback: async (_action, context) => self.send(getChannels(DiParam.trigger, allInputs), context.signal),
					subscribe: async () => self.send(getChannels(DiParam.trigger, allInputs)),
				}
			: undefined,
		[ActionId.SetDiCntStart]: di
			? {
					name: 'Set DI Count Start',
					options: [diOption, choiceOption('mode', 'Count', START_STOP_CHOICES)],
					callback: async ({ actionId, options }, context) => {
						const start = choiceValue(options.mode, START_STOP_CHOICES)
						await set(
							{
								actionId,
								param: DiParam.countStart,
								selected: options.di,
								count: inputCount,
								option: options.mode,
								value: start,
							},
							context.signal,
						)
					},
					optionsToMonitorForSubscribe: ['di'],
					subscribe: async ({ options }) => get(DiParam.countStart, options.di, inputCount),
				}
			: undefined,
		[ActionId.SetDiFilter]: di
			? {
					name: 'Set DI Filter',
					options: [diOption, filterOption()],
					callback: async ({ actionId, options }, context) => {
						const filter = halfMsValue(options.filter, FILTER_MIN, FILTER_MAX)
						await set(
							{
								actionId,
								param: DiParam.filter,
								selected: options.di,
								count: inputCount,
								option: options.filter,
								value: filter,
							},
							context.signal,
						)
					},
					optionsToMonitorForSubscribe: ['di'],
					subscribe: async ({ options }) => get(DiParam.filter, options.di, inputCount),
				}
			: undefined,
		[ActionId.GetDiFilter]: di
			? {
					name: 'Get DI Filter',
					options: [],
					optionsToMonitorForSubscribe: [],
					callback: async (_action, context) => self.send(getChannels(DiParam.filter, allInputs), context.signal),
					subscribe: async () => self.send(getChannels(DiParam.filter, allInputs)),
				}
			: undefined,
		[ActionId.GetDiCount]: di
			? {
					name: 'Get DI Count',
					options: [],
					optionsToMonitorForSubscribe: [],
					callback: async (_action, context) => self.send(getChannels(DiParam.count, allInputs), context.signal),
					subscribe: async () => self.send(getChannels(DiParam.count, allInputs)),
				}
			: undefined,
	}
	self.setActionDefinitions(actions)
}
