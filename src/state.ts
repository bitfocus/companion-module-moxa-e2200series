import type { ChannelCounts } from './consts.js'
import { DiParam, DoParam, INFO, type ReplyParam } from './protocol.js'
import type { VariablesSchema } from './variables.js'

/** A digital input, each field undefined until the device reports it */
export type DiState = {
	mode?: number
	status?: boolean
	trigger?: number
	cntStart?: boolean
}

/** A digital output, each field undefined until the device reports it */
export type DoState = {
	mode?: number
	status?: boolean
	pulseStart?: boolean
}

/** A field of a channel that feedbacks show */
export type StateChange = 'diMode' | 'diStatus' | 'diTrigger' | 'diCntStart' | 'doMode' | 'doStatus' | 'doPulseStart'

export type ApplyResult = {
	/** The variables the reply set */
	variables: Partial<VariablesSchema>
	/** The fields whose value the reply changed */
	changed: Set<StateChange>
	/** Parameters the module doesn't know, or with a channel or value it can't use, as the device sent them */
	unexpected: string[]
}

/** The device's state, as far as it has reported it */
export class DeviceState {
	readonly inputs: DiState[]
	readonly outputs: DoState[]

	constructor(counts: ChannelCounts) {
		this.inputs = Array.from({ length: counts.inputs }, () => ({}))
		this.outputs = Array.from({ length: counts.outputs }, () => ({}))
	}

	get counts(): ChannelCounts {
		return { inputs: this.inputs.length, outputs: this.outputs.length }
	}

	/** An input, or undefined for anything that isn't one of this model's channels */
	input(channel: unknown): DiState | undefined {
		return typeof channel === 'number' && Number.isInteger(channel) ? this.inputs[channel] : undefined
	}

	/** An output, or undefined for anything that isn't one of this model's channels */
	output(channel: unknown): DoState | undefined {
		return typeof channel === 'number' && Number.isInteger(channel) ? this.outputs[channel] : undefined
	}

	/** Takes in the parameters of a reply */
	apply(params: readonly ReplyParam[]): ApplyResult {
		const result: ApplyResult = { variables: {}, changed: new Set(), unexpected: [] }
		for (const param of params) {
			if (!this.#applyParam(param, result)) result.unexpected.push(`${param.key}=${param.value}`)
		}
		return result
	}

	/** @returns false for a parameter it can't use */
	#applyParam({ name, channel, value }: ReplyParam, result: ApplyResult): boolean {
		const info = INFO.find((i) => i.key.split('_')[0] === name)
		if (info !== undefined) {
			result.variables[info.variable] = value
			return true
		}
		if (channel === undefined) return false
		const number = /^-?\d+$/.test(value) ? Number(value) : NaN
		if (Number.isNaN(number)) return false
		const di = this.inputs[channel]
		const out = this.outputs[channel]
		const set = <T extends object, K extends keyof T>(target: T, key: K, next: T[K], change: StateChange) => {
			if (target[key] !== next) result.changed.add(change)
			target[key] = next
		}
		switch (name) {
			case DiParam.mode:
				if (di === undefined) return false
				set(di, 'mode', number, 'diMode')
				return true
			case DiParam.status:
				if (di === undefined) return false
				set(di, 'status', number !== 0, 'diStatus')
				return true
			case DiParam.trigger:
				if (di === undefined) return false
				set(di, 'trigger', number, 'diTrigger')
				return true
			case DiParam.countStart:
				if (di === undefined) return false
				set(di, 'cntStart', number !== 0, 'diCntStart')
				return true
			case DiParam.count:
				if (di === undefined) return false
				result.variables[`count_input_${channel}`] = number
				return true
			case DiParam.filter:
				if (di === undefined) return false
				result.variables[`filter_input_${channel}`] = number / 2
				return true
			case DoParam.mode:
				if (out === undefined) return false
				set(out, 'mode', number, 'doMode')
				return true
			case DoParam.status:
				if (out === undefined) return false
				set(out, 'status', number !== 0, 'doStatus')
				return true
			case DoParam.pulseStart:
				if (out === undefined) return false
				set(out, 'pulseStart', number !== 0, 'doPulseStart')
				return true
			case DoParam.lowWidth:
				if (out === undefined) return false
				result.variables[`lowWidth_output_${channel}`] = number / 2
				return true
			case DoParam.highWidth:
				if (out === undefined) return false
				result.variables[`highWidth_output_${channel}`] = number / 2
				return true
			default:
				return false
		}
	}
}
