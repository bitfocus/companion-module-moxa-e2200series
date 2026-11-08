import type { CompanionFeedbackDefinitions } from '@companion-module/base'
import type MoxaE2200Instance from './main.js'
import { channelChoices, DI_MODE_CHOICES, DI_TRIGGER_CHOICES, DO_MODE_CHOICES, styles } from './consts.js'
import { choiceOption, inputOption, outputOption } from './options.js'
import type { StateChange } from './state.js'

/** Feedback ids. The values are the ids saved against every button using the feedback, so they must never change */
export enum FeedbackId {
	DoStatus = 'do_status',
	DoMode = 'do_mode',
	DoPulse = 'do_pulse',
	DiStatus = 'di_status',
	DiCntStart = 'di_cntStart',
	DiMode = 'di_mode',
	DiTrigger = 'di_trigger',
}

// The trigger option is called mode. The id is saved against every button, so it stays
export type FeedbackSchema = {
	[FeedbackId.DoStatus]: { type: 'boolean'; options: { do: number } }
	[FeedbackId.DoMode]: { type: 'boolean'; options: { do: number; mode: number } }
	[FeedbackId.DoPulse]: { type: 'boolean'; options: { do: number } }
	[FeedbackId.DiStatus]: { type: 'boolean'; options: { di: number } }
	[FeedbackId.DiCntStart]: { type: 'boolean'; options: { di: number } }
	[FeedbackId.DiMode]: { type: 'boolean'; options: { di: number; mode: number } }
	[FeedbackId.DiTrigger]: { type: 'boolean'; options: { di: number; mode: number } }
}

/** The feedback that shows each field of the state */
const FEEDBACK_FOR_CHANGE: Record<StateChange, FeedbackId> = {
	doStatus: FeedbackId.DoStatus,
	doMode: FeedbackId.DoMode,
	doPulseStart: FeedbackId.DoPulse,
	diStatus: FeedbackId.DiStatus,
	diCntStart: FeedbackId.DiCntStart,
	diMode: FeedbackId.DiMode,
	diTrigger: FeedbackId.DiTrigger,
}

/** The feedbacks to check after the fields changed */
export function feedbacksFor(changes: Iterable<StateChange>): FeedbackId[] {
	return [...new Set([...changes].map((change) => FEEDBACK_FOR_CHANGE[change]))]
}

export function UpdateFeedbacks(self: MoxaE2200Instance): void {
	const doOption = outputOption(channelChoices(self.state.outputs.length, 'Output'))
	const diOption = inputOption(channelChoices(self.state.inputs.length, 'Input'))
	const di = self.state.inputs.length > 0

	const feedbacks: CompanionFeedbackDefinitions<FeedbackSchema> = {
		[FeedbackId.DoStatus]: {
			name: 'DO Status',
			type: 'boolean',
			defaultStyle: styles.defaultRed,
			options: [doOption],
			callback: ({ options }) => self.state.output(options.do)?.status ?? false,
		},
		[FeedbackId.DoMode]: {
			name: 'DO Mode',
			type: 'boolean',
			defaultStyle: styles.defaultRed,
			options: [doOption, choiceOption('mode', 'Mode', DO_MODE_CHOICES)],
			callback: ({ options }) => {
				const mode = self.state.output(options.do)?.mode
				return mode !== undefined && mode === options.mode
			},
		},
		[FeedbackId.DoPulse]: {
			name: 'DO Pulse',
			type: 'boolean',
			defaultStyle: styles.defaultRed,
			options: [doOption],
			callback: ({ options }) => self.state.output(options.do)?.pulseStart ?? false,
		},
		[FeedbackId.DiStatus]: di
			? {
					name: 'DI Status',
					type: 'boolean',
					defaultStyle: styles.defaultRed,
					options: [diOption],
					callback: ({ options }) => self.state.input(options.di)?.status ?? false,
				}
			: undefined,
		[FeedbackId.DiCntStart]: di
			? {
					name: 'DI Counter',
					type: 'boolean',
					defaultStyle: styles.defaultRed,
					options: [diOption],
					callback: ({ options }) => self.state.input(options.di)?.cntStart ?? false,
				}
			: undefined,
		[FeedbackId.DiMode]: di
			? {
					name: 'DI Mode',
					type: 'boolean',
					defaultStyle: styles.defaultRed,
					options: [diOption, choiceOption('mode', 'Mode', DI_MODE_CHOICES)],
					callback: ({ options }) => {
						const mode = self.state.input(options.di)?.mode
						return mode !== undefined && mode === options.mode
					},
				}
			: undefined,
		[FeedbackId.DiTrigger]: di
			? {
					name: 'DI Trigger',
					type: 'boolean',
					defaultStyle: styles.defaultRed,
					options: [diOption, choiceOption('mode', 'Trigger', DI_TRIGGER_CHOICES)],
					callback: ({ options }) => {
						const trigger = self.state.input(options.di)?.trigger
						return trigger !== undefined && trigger === options.mode
					},
				}
			: undefined,
	}
	self.setFeedbackDefinitions(feedbacks)
}
