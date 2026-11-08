import { describe, expect, it } from 'vitest'
import { ActionId } from '../actions.js'
import { actionDefinitions, definition, fakeInstance, runAction, subscribeAction } from './fixtures.js'

const DI_ACTIONS = [
	ActionId.SetDiMode,
	ActionId.GetDiMode,
	ActionId.SetDiTrigger,
	ActionId.GetDiTrigger,
	ActionId.SetDiCntStart,
	ActionId.SetDiFilter,
	ActionId.GetDiFilter,
	ActionId.GetDiCount,
]

describe('set actions', () => {
	it.each([
		[ActionId.SetDoStatus, { do: [0, 3], status: 1 }, 'setParam.cgi?DOStatus_00=1&DOStatus_03=1'],
		[ActionId.SetDoMode, { do: [1], mode: 1 }, 'setParam.cgi?DOMode_01=1'],
		[ActionId.SetDoPulseStart, { do: [7], mode: 0 }, 'setParam.cgi?DOPulseStart_07=0'],
		[ActionId.SetDiMode, { di: [11], mode: 1 }, 'setParam.cgi?DIMode_11=1'],
		[ActionId.SetDiTrigger, { di: [0], mode: 2 }, 'setParam.cgi?DITrigger_00=2'],
		[ActionId.SetDiCntStart, { di: [0, 1], mode: 1 }, 'setParam.cgi?DICntStart_00=1&DICntStart_01=1'],
	])('%s sends the value to each selected channel', async (actionId, options, message) => {
		const fake = fakeInstance(0)
		await runAction(actionDefinitions(fake), actionId, options)
		expect(fake.send).toHaveBeenCalledExactlyOnceWith(message, expect.any(AbortSignal))
	})

	it('passes the context signal through, so Companion can drop a request no longer wanted', async () => {
		const fake = fakeInstance(0)
		const controller = new AbortController()
		await runAction(actionDefinitions(fake), ActionId.SetDoStatus, { do: [0], status: 1 }, controller.signal)
		expect(fake.send.mock.calls[0][1]).toBe(controller.signal)
	})

	it.each([
		[ActionId.SetDoLowWidth, { do: [0], lowWidth: 100 }, 'setParam.cgi?DOLowWidth_00=200'],
		[ActionId.SetDoHighWidth, { do: [0], highWidth: 0.5 }, 'setParam.cgi?DOHighWidth_00=1'],
		// The limits found testing a device, below the manual's 65535 units
		[ActionId.SetDoHighWidth, { do: [0], highWidth: 32767 }, 'setParam.cgi?DOHighWidth_00=65534'],
		[ActionId.SetDiFilter, { di: [2], filter: 50.7 }, 'setParam.cgi?DIFilter_02=101'],
		[ActionId.SetDiFilter, { di: [2], filter: 8480 }, 'setParam.cgi?DIFilter_02=16960'],
	])('%s sends the time in units of 0.5 ms', async (actionId, options, message) => {
		const fake = fakeInstance(0)
		await runAction(actionDefinitions(fake), actionId, options)
		expect(fake.send).toHaveBeenCalledExactlyOnceWith(message, expect.any(AbortSignal))
	})

	it('sends an e2214 relay width in units of 0.5 ms, as it always has', async () => {
		// The manual has relays count in 1.5 s, but the e2214 is deliberately left as it was. See PULSE_WIDTH_MIN
		const fake = fakeInstance(2)
		await runAction(actionDefinitions(fake), ActionId.SetDoLowWidth, { do: [5], lowWidth: 100 })
		expect(fake.send).toHaveBeenCalledExactlyOnceWith('setParam.cgi?DOLowWidth_05=200', expect.any(AbortSignal))
	})

	it.each([
		[ActionId.SetDoLowWidth, { do: [0], lowWidth: 0.4 }],
		[ActionId.SetDoLowWidth, { do: [0], lowWidth: 32767.5 }],
		[ActionId.SetDoHighWidth, { do: [0], highWidth: '100' }],
		[ActionId.SetDiFilter, { di: [0], filter: 8480.5 }],
		[ActionId.SetDiFilter, { di: [0], filter: null }],
		[ActionId.SetDoStatus, { do: [0], status: 2 }],
		[ActionId.SetDiTrigger, { di: [0], mode: 'Both' }],
	])('%s sends nothing for a value out of range, and warns', async (actionId, options) => {
		const fake = fakeInstance(0)
		await runAction(actionDefinitions(fake), actionId, options)
		expect(fake.send).not.toHaveBeenCalled()
		expect(fake.log).toHaveBeenCalledWith('warn', expect.stringContaining('out of range'))
	})

	it('takes a lone channel, as an action saved by 2.x and never edited holds', async () => {
		const fake = fakeInstance(0)
		await runAction(actionDefinitions(fake), ActionId.SetDoStatus, { do: 0, status: 1 })
		expect(fake.send).toHaveBeenCalledExactlyOnceWith('setParam.cgi?DOStatus_00=1', expect.any(AbortSignal))
	})

	it('leaves out channels the model does not have, and repeats', async () => {
		const fake = fakeInstance(4) // 4 outputs
		await runAction(actionDefinitions(fake), ActionId.SetDoStatus, { do: [3, 4, 3, '1', -1, 1.5], status: 0 })
		expect(fake.send).toHaveBeenCalledExactlyOnceWith(
			'setParam.cgi?DOStatus_03=0&DOStatus_01=0',
			expect.any(AbortSignal),
		)
	})

	it('sends nothing when no channel is valid, and warns', async () => {
		// It used to send setParam.cgi? with no parameters
		const fake = fakeInstance(4)
		await runAction(actionDefinitions(fake), ActionId.SetDoStatus, { do: [], status: 1 })
		await runAction(actionDefinitions(fake), ActionId.SetDoStatus, { do: [9], status: 1 })
		expect(fake.send).not.toHaveBeenCalled()
		expect(fake.log).toHaveBeenCalledWith('warn', expect.stringContaining('no valid channels'))
	})

	it('asks for the selected channels when placed, watching only the channels option', async () => {
		const fake = fakeInstance(0)
		const defs = actionDefinitions(fake)
		await subscribeAction(defs, ActionId.SetDoLowWidth, { do: [1, 2], lowWidth: 5 })
		await subscribeAction(defs, ActionId.SetDiTrigger, { di: [3], mode: 1 })
		expect(fake.send.mock.calls).toEqual([
			['getParam.cgi?DOLowWidth_01=?&DOLowWidth_02=?'],
			['getParam.cgi?DITrigger_03=?'],
		])
		expect(definition(defs, ActionId.SetDoLowWidth).optionsToMonitorForSubscribe).toEqual(['do'])
		expect(definition(defs, ActionId.SetDiTrigger).optionsToMonitorForSubscribe).toEqual(['di'])
	})
})

describe('get actions', () => {
	it.each([
		[ActionId.GetDoStatus, ['getParam.cgi?DOStatus_00=?&DOStatus_01=?&DOStatus_02=?&DOStatus_03=?']],
		[ActionId.GetDoMode, ['getParam.cgi?DOMode_00=?&DOMode_01=?&DOMode_02=?&DOMode_03=?']],
		[
			ActionId.GetDoPulseStart,
			['getParam.cgi?DOPulseStart_00=?&DOPulseStart_01=?&DOPulseStart_02=?&DOPulseStart_03=?'],
		],
		[
			ActionId.GetDoPulseWidth,
			[
				'getParam.cgi?DOLowWidth_00=?&DOLowWidth_01=?&DOLowWidth_02=?&DOLowWidth_03=?',
				'getParam.cgi?DOHighWidth_00=?&DOHighWidth_01=?&DOHighWidth_02=?&DOHighWidth_03=?',
			],
		],
	])('%s asks for every output', async (actionId, messages) => {
		const fake = fakeInstance(4)
		const controller = new AbortController()
		await runAction(actionDefinitions(fake), actionId, {}, controller.signal)
		expect(fake.send.mock.calls).toEqual(messages.map((m) => [m, controller.signal]))
	})

	it.each([
		[ActionId.GetDiMode, 'DIMode'],
		[ActionId.GetDiTrigger, 'DITrigger'],
		[ActionId.GetDiFilter, 'DIFilter'],
		[ActionId.GetDiCount, 'DICNT'],
	])('%s asks for every input', async (actionId, param) => {
		const fake = fakeInstance(2) // 6 inputs
		await runAction(actionDefinitions(fake), actionId)
		const keys = [0, 1, 2, 3, 4, 5].map((c) => `${param}_0${c}=?`).join('&')
		expect(fake.send).toHaveBeenCalledExactlyOnceWith(`getParam.cgi?${keys}`, expect.any(AbortSignal))
	})

	it('asks again when placed, without a signal', async () => {
		const fake = fakeInstance(4)
		await subscribeAction(actionDefinitions(fake), ActionId.GetDoStatus)
		expect(fake.send).toHaveBeenCalledExactlyOnceWith(
			'getParam.cgi?DOStatus_00=?&DOStatus_01=?&DOStatus_02=?&DOStatus_03=?',
		)
	})
})

describe('definitions', () => {
	it('offers no input actions on a model with no inputs', () => {
		const defs = actionDefinitions(fakeInstance(4))
		for (const id of DI_ACTIONS) expect(defs[id], id).toBeUndefined()
		expect(defs[ActionId.SetDoStatus]).toBeDefined()
	})

	it('offers every action on a model with inputs', () => {
		const defs = actionDefinitions(fakeInstance(0))
		for (const id of Object.values(ActionId)) expect(defs[id], id).toBeDefined()
	})

	it('defaults the channels to an array holding the first', () => {
		// The default was a lone channel, not an array
		const defs = actionDefinitions(fakeInstance(0))
		expect(definition(defs, ActionId.SetDoStatus).options[0]).toMatchObject({ type: 'multidropdown', default: [0] })
		expect(definition(defs, ActionId.SetDiMode).options[0]).toMatchObject({ type: 'multidropdown', default: [0] })
	})
})
