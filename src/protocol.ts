import { channelIds, PollData, type ChannelCounts } from './consts.js'

/** The device's CGI, relative to http://host/. Its keys are in appendix G of the E2200 manual (v1.0) */
export const GET_PATH = 'getParam.cgi'
export const SET_PATH = 'setParam.cgi'

/** Replies separate parameters with this */
const REPLY_SEPARATOR = '<br>'

/** Per channel parameters of the digital inputs. Sent and replied to as `<param>_<channel, 2 digits>` */
export const DiParam = {
	mode: 'DIMode',
	status: 'DIStatus',
	filter: 'DIFilter',
	trigger: 'DITrigger',
	countStart: 'DICntStart',
	count: 'DICNT',
} as const

/** Per channel parameters of the digital outputs. Sent and replied to as `<param>_<channel, 2 digits>` */
export const DoParam = {
	mode: 'DOMode',
	status: 'DOStatus',
	lowWidth: 'DOLowWidth',
	highWidth: 'DOHighWidth',
	pulseStart: 'DOPulseStart',
} as const

export type DiParam = (typeof DiParam)[keyof typeof DiParam]
export type DoParam = (typeof DoParam)[keyof typeof DoParam]

/** The device information, and the variable each sets */
export const INFO = [
	{ key: 'DATE', variable: 'date' },
	{ key: 'TIME', variable: 'time' },
	{ key: 'LOC', variable: 'location' },
	{ key: 'DESC', variable: 'description' },
	{ key: 'FWR_V', variable: 'firmware' },
	{ key: 'MOD_NAME', variable: 'model' },
	{ key: 'SN_NUM', variable: 'serial' },
	{ key: 'MAC_ADDR', variable: 'macAddr' },
	{ key: 'IP', variable: 'IP' },
] as const

export type InfoVariable = (typeof INFO)[number]['variable']

export function channelKey(param: DiParam | DoParam, channel: number): string {
	return `${param}_${channel.toString(10).padStart(2, '0')}`
}

/** Asks for each of the keys */
export function getMessage(keys: readonly string[]): string {
	return `${GET_PATH}?${keys.map((key) => `${key}=?`).join('&')}`
}

/** Asks for a parameter of each channel */
export function getChannels(param: DiParam | DoParam, channels: readonly number[]): string {
	return getMessage(channels.map((channel) => channelKey(param, channel)))
}

/** Sets a parameter of each channel to the same value */
export function setChannels(param: DiParam | DoParam, channels: readonly number[], value: number): string {
	return `${SET_PATH}?${channels.map((channel) => `${channelKey(param, channel)}=${value}`).join('&')}`
}

export function infoQuery(): string {
	return getMessage(INFO.map((info) => info.key))
}

export function timeQuery(): string {
	return getMessage(['TIME', 'DATE'])
}

/**
 * Everything the module shows: the device information, and every parameter of every channel. Sent on connecting, and
 * again after the device has been unreachable.
 */
export function fullQuery(counts: ChannelCounts): string[] {
	const outputs = channelIds(counts.outputs)
	const messages = [
		infoQuery(),
		getChannels(DoParam.status, outputs),
		getChannels(DoParam.mode, outputs),
		getChannels(DoParam.pulseStart, outputs),
		getChannels(DoParam.lowWidth, outputs),
		getChannels(DoParam.highWidth, outputs),
	]
	if (counts.inputs > 0) {
		const inputs = channelIds(counts.inputs)
		messages.push(
			getChannels(DiParam.status, inputs),
			getChannels(DiParam.mode, inputs),
			getChannels(DiParam.trigger, inputs),
			getChannels(DiParam.countStart, inputs),
			getChannels(DiParam.count, inputs),
			getChannels(DiParam.filter, inputs),
		)
	}
	return messages
}

/** What each poll asks for: the date and time, and whatever the config chose */
export function pollQuery(counts: ChannelCounts, poll: readonly PollData[]): string[] {
	const messages = [timeQuery()]
	if (counts.inputs > 0) {
		const inputs = channelIds(counts.inputs)
		if (poll.includes(PollData.DiStatus)) messages.push(getChannels(DiParam.status, inputs))
		if (poll.includes(PollData.DiCount)) messages.push(getChannels(DiParam.count, inputs))
		if (poll.includes(PollData.DiCountStart)) messages.push(getChannels(DiParam.countStart, inputs))
	}
	const outputs = channelIds(counts.outputs)
	if (poll.includes(PollData.DoStatus)) messages.push(getChannels(DoParam.status, outputs))
	if (poll.includes(PollData.DoPulse)) messages.push(getChannels(DoParam.pulseStart, outputs))
	return messages
}

/** One `key=value` from a reply */
export type ReplyParam = {
	/** As the device sent it, eg `DOStatus_03` or `FWR_V` */
	readonly key: string
	/** The key up to its first underscore, eg `DOStatus` or `FWR` */
	readonly name: string
	/** The channel, for a key ending in a channel number */
	readonly channel: number | undefined
	readonly value: string
}

/**
 * Splits a reply into its parameters. Anything between separators that isn't `key=value` is dropped, as the module
 * always has. A value can hold `=`, as a location or description might.
 */
export function parseReply(text: string): ReplyParam[] {
	const params: ReplyParam[] = []
	for (const element of text.replaceAll('"', '').split(REPLY_SEPARATOR)) {
		const eq = element.indexOf('=')
		if (eq < 0) continue
		const key = element.slice(0, eq).trim()
		const value = element.slice(eq + 1).trim()
		const [name, suffix] = key.split('_')
		const channel = suffix !== undefined && /^\d+$/.test(suffix) ? Number(suffix) : undefined
		params.push({ key, name, channel, value })
	}
	return params
}
