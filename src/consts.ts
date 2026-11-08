import { combineRgb, type DropdownChoice } from '@companion-module/base'

/** The models, as the config saves them. The ids are saved in every config, so must never change */
export const MODEL_CHOICES = [
	{ id: 0, label: 'e2210' },
	{ id: 1, label: 'e2212' },
	{ id: 2, label: 'e2214' },
	{ id: 3, label: 'e2242' },
	{ id: 4, label: 'e2260' },
	{ id: 5, label: 'e2262' },
] as const satisfies DropdownChoice<number>[]

export type Model = (typeof MODEL_CHOICES)[number]['id']

/** How many digital inputs and outputs a model has */
export type ChannelCounts = { readonly inputs: number; readonly outputs: number }

/** The channels of each model, as the manual's CGI commands list them. A DIO counts as both a DI and a DO */
const CHANNEL_COUNTS: Record<Model, ChannelCounts> = {
	0: { inputs: 12, outputs: 8 },
	1: { inputs: 12, outputs: 12 },
	2: { inputs: 6, outputs: 6 },
	3: { inputs: 12, outputs: 12 },
	4: { inputs: 0, outputs: 4 },
	5: { inputs: 0, outputs: 4 },
}

/** The channels of a model, or undefined for one this version doesn't know. A saved config isn't checked against its field */
export function modelChannels(model: unknown): ChannelCounts | undefined {
	const known = MODEL_CHOICES.find((choice) => choice.id === model)
	return known === undefined ? undefined : CHANNEL_COUNTS[known.id]
}

/**
 * The device counts pulse widths and filter times in units of 0.5 ms. The step and the limits are the ones the module
 * has always used, found testing an e2210. The manual (v1.0) differs: it has both take up to 65535 units (32767.5 ms),
 * and an e2214's relays count pulse widths in 1.5 s. The e2214 is left on 0.5 ms as it always has been, untested, as no
 * bug has been reported against it.
 */
export const PULSE_WIDTH_MIN = 0.5
export const PULSE_WIDTH_MAX = 32767
export const FILTER_MIN = 0.5
export const FILTER_MAX = 8480

/** The ids of the data the config can choose to poll. Saved in every config, so must never change */
export const PollData = {
	DiStatus: 0,
	DiCount: 1,
	DiCountStart: 2,
	DoStatus: 3,
	DoPulse: 4,
} as const

export type PollData = (typeof PollData)[keyof typeof PollData]

export const POLL_CHOICES = [
	{ id: PollData.DiStatus, label: 'DI: Status' },
	{ id: PollData.DiCount, label: 'DI: Count' },
	{ id: PollData.DiCountStart, label: 'DI: Count Start' },
	{ id: PollData.DoStatus, label: 'DO: Status' },
	{ id: PollData.DoPulse, label: 'DO: Pulse' },
] as const satisfies DropdownChoice<PollData>[]

export const DI_MODE_CHOICES = [
	{ id: 0, label: 'DI' },
	{ id: 1, label: 'Counter' },
] as const satisfies DropdownChoice<number>[]

export const DI_TRIGGER_CHOICES = [
	{ id: 0, label: 'Low to High' },
	{ id: 1, label: 'High to Low' },
	{ id: 2, label: 'Both' },
] as const satisfies DropdownChoice<number>[]

export const DO_MODE_CHOICES = [
	{ id: 0, label: 'DO' },
	{ id: 1, label: 'Pulse' },
] as const satisfies DropdownChoice<number>[]

export const ON_OFF_CHOICES = [
	{ id: 0, label: 'Off' },
	{ id: 1, label: 'On' },
] as const satisfies DropdownChoice<number>[]

export const START_STOP_CHOICES = [
	{ id: 0, label: 'Stop' },
	{ id: 1, label: 'Start' },
] as const satisfies DropdownChoice<number>[]

/** The channel ids 0 to count - 1 */
export function channelIds(count: number): number[] {
	return Array.from({ length: count }, (_, i) => i)
}

export function channelChoices(count: number, label: 'Input' | 'Output'): DropdownChoice<number>[] {
	return channelIds(count).map((id) => ({ id, label: `${label} ${id}` }))
}

export const colours = {
	black: combineRgb(0, 0, 0),
	white: combineRgb(255, 255, 255),
	red: combineRgb(255, 0, 0),
}

export const styles = {
	defaultRed: {
		bgcolor: colours.red,
		color: colours.black,
	},
}
