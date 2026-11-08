import { describe, expect, it } from 'vitest'
import { GetConfigFields, pollData, type ModuleConfig } from '../config.js'
import { PollData } from '../consts.js'

describe('config', () => {
	it('gives every field a width', () => {
		// Model and Poll Data had it misspelt as witdth, so took the full width
		const widths = Object.fromEntries(GetConfigFields().map((field) => [field.id, field.width]))
		expect(widths).toEqual({ model: 6, host: 12, pollInterval: 6, poll: 6, verbose: 6 })
	})

	it('polls only the data the config chose that this version knows', () => {
		const config = (poll: unknown) => ({ poll }) as unknown as ModuleConfig
		expect(pollData(config([PollData.DoStatus, 7, '0', PollData.DiCount]))).toEqual([
			PollData.DoStatus,
			PollData.DiCount,
		])
		expect(pollData(config(undefined))).toEqual([])
	})
})
