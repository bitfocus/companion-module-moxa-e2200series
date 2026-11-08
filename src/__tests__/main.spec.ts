import { setTimeout as sleep } from 'node:timers/promises'
import { InstanceStatus, type CompanionActionDefinitions } from '@companion-module/base'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MoxaE2200Instance from '../main.js'
import { ActionId, type ActionSchema } from '../actions.js'
import type { ModuleConfig } from '../config.js'
import { PollData } from '../consts.js'
import { fullQuery, infoQuery, pollQuery } from '../protocol.js'
import { DEVICE_INFO, FakeMoxa } from './fakeMoxa.js'
import { runAction } from './fixtures.js'
import { createContext, type HostContext } from './hostContext.js'

let fake: FakeMoxa
const instances: MoxaE2200Instance[] = []

beforeEach(async () => {
	fake = new FakeMoxa()
	await fake.listen()
	for (const [key, value] of Object.entries(DEVICE_INFO)) fake.params.set(key, value)
})

afterEach(async () => {
	for (const instance of instances.splice(0)) await instance.destroy()
	await fake.close()
})

function createInstance() {
	const context = createContext()
	const instance = new MoxaE2200Instance(context)
	instance.requestTimeout = 1000
	const log = vi.spyOn(instance, 'log').mockImplementation(() => {})
	instances.push(instance)
	return { instance, context, log }
}

/** An e2260: four outputs and no inputs, so the full query is short */
function config(overrides: Partial<ModuleConfig> = {}): ModuleConfig {
	return {
		model: 4,
		host: `127.0.0.1:${fake.port}`,
		pollInterval: 0,
		poll: [PollData.DoStatus],
		verbose: false,
		...overrides,
	}
}

const E2260 = { inputs: 0, outputs: 4 }
/** The query of each message, as the fake records it */
const queries = (messages: string[]) => messages.map((m) => m.slice('getParam.cgi?'.length))

/** The variable values set, merged */
const variables = (context: HostContext): Record<string, unknown> =>
	Object.assign({}, ...context.setVariableValues.mock.calls.map(([values]) => values as object))

const definedActions = (context: HostContext) =>
	context.setActionDefinitions.mock.calls.at(-1)?.[0] as CompanionActionDefinitions<ActionSchema>

/** Waits for the full query to be answered */
async function started(overrides: Partial<ModuleConfig> = {}) {
	const created = createInstance()
	await created.instance.init(config(overrides))
	const count = fullQuery(E2260).length
	await vi.waitFor(() => expect(fake.requests.length).toBeGreaterThanOrEqual(count))
	await vi.waitFor(() => expect(created.context.updateStatus).toHaveBeenLastCalledWith(InstanceStatus.Ok, null))
	await vi.waitFor(() => expect(variables(created.context)).toHaveProperty('IP'))
	return created
}

describe('connecting', () => {
	it('asks for everything, and shows it', async () => {
		fake.params.set('DOStatus_02', '1')
		fake.params.set('DOMode_01', '1')
		fake.params.set('DOLowWidth_03', '300')
		const { instance, context } = await started()
		await vi.waitFor(() => expect(variables(context)).toHaveProperty('highWidth_output_3'))
		expect(fake.queries('getParam.cgi')).toEqual(queries(fullQuery(E2260)))
		expect(variables(context)).toMatchObject({
			date: '2026/11/08',
			time: '16:45:00',
			location: 'Rack 3',
			description: 'Stage GPIO',
			firmware: 'V1.13',
			model: 'E2210',
			serial: 'TAHFB1234567',
			macAddr: '00:90:E8:12:34:56',
			IP: '192.168.127.254',
			lowWidth_output_3: 150,
			highWidth_output_3: 0,
		})
		expect(instance.state.outputs[2]).toEqual({ status: true, mode: 0, pulseStart: false })
		expect(instance.state.outputs[1]).toMatchObject({ mode: 1 })
		expect(context.checkFeedbacks).toHaveBeenCalledWith(['do_status'])
		expect(context.checkFeedbacks).toHaveBeenCalledWith(['do_mode'])
		expect(context.checkFeedbacks).toHaveBeenCalledWith(['do_pulse'])
		expect(context.updateStatus.mock.calls[0]).toEqual([InstanceStatus.Connecting, null])
	})

	it('defines the actions, feedbacks and variables for the model', async () => {
		const { instance, context } = createInstance()
		await instance.init(config({ model: 0, pollInterval: 0 }))
		const variableIds = Object.keys(context.setVariableDefinitions.mock.calls[0][0] as object)
		expect(variableIds).toContain('count_input_11')
		expect(variableIds).toContain('lowWidth_output_7')
		expect(variableIds).not.toContain('lowWidth_output_8')
		expect(definedActions(context)[ActionId.SetDiMode]).toBeDefined()
		expect(context.checkAllFeedbacks).toHaveBeenCalledOnce()
	})

	it('reports an unrecognised model', async () => {
		const { instance, context, log } = createInstance()
		await instance.init(config({ model: 9 as ModuleConfig['model'] }))
		expect(context.updateStatus).toHaveBeenCalledWith(InstanceStatus.BadConfig, 'Unrecognised model')
		// It used to log the config's device, which there is none of
		expect(log).toHaveBeenCalledWith('error', 'Unrecognised model: 9')
		await sleep(50)
		expect(fake.requests).toEqual([])
	})

	it('reports no hostname, but still defines the actions', async () => {
		const { instance, context } = createInstance()
		await instance.init(config({ host: ' ' }))
		expect(context.updateStatus).toHaveBeenCalledWith(InstanceStatus.BadConfig, 'No hostname')
		expect(context.setActionDefinitions).toHaveBeenCalledOnce()
		await sleep(50)
		expect(fake.requests).toEqual([])
	})
})

describe('polling', () => {
	it('asks for the date, the time and what the config chose, checking feedbacks only when something changed', async () => {
		const { context } = await started({ pollInterval: 0.05, poll: [PollData.DoStatus, PollData.DoPulse] })
		const poll = queries(pollQuery(E2260, [PollData.DoStatus, PollData.DoPulse]))
		const full = fullQuery(E2260).length
		await vi.waitFor(() => expect(fake.requests.length).toBeGreaterThanOrEqual(full + poll.length * 2))
		expect(fake.queries('getParam.cgi').slice(full, full + poll.length * 2)).toEqual([...poll, ...poll])

		context.checkFeedbacks.mockClear()
		const before = fake.requests.length
		await vi.waitFor(() => expect(fake.requests.length).toBeGreaterThanOrEqual(before + poll.length))
		expect(context.checkFeedbacks).not.toHaveBeenCalled()

		fake.params.set('DOStatus_00', '1')
		await vi.waitFor(() => expect(context.checkFeedbacks).toHaveBeenCalled())
		expect(context.checkFeedbacks.mock.calls).toEqual([[['do_status']]])
	})

	it('stops once destroyed, even with a poll in flight', async () => {
		// It used to start polling again when the poll in flight finished
		const { instance, log } = await started({ pollInterval: 0.05 })
		fake.hold()
		const held = fake.requests.length
		await vi.waitFor(() => expect(fake.requests.length).toBe(held + 1))
		await instance.destroy()
		fake.release()
		await sleep(50)
		const requests = fake.requests.length
		const logs = log.mock.calls.length
		await sleep(300)
		expect(fake.requests.length).toBe(requests)
		expect(log.mock.calls.length).toBe(logs)
	})

	it('drops the old config, and its poll in flight, when the config changes', async () => {
		fake.hold()
		const { instance } = createInstance()
		await instance.init(config({ pollInterval: 0 }))
		await vi.waitFor(() => expect(fake.requests).toHaveLength(1))
		await instance.configUpdated(config({ model: 5, pollInterval: 0 }))
		fake.release()
		const full = queries(fullQuery(E2260))
		await vi.waitFor(() => expect(fake.requests).toHaveLength(1 + full.length))
		await sleep(250)
		// The first, held, is the old config's. Nothing more of its full query is sent
		expect(fake.queries('getParam.cgi')).toEqual([full[0], ...full])
	})

	it('asks for everything again once an unreachable device answers', async () => {
		// It asked once, on connecting, so a device switched on after Companion never had its information shown
		fake.unreachable = true
		const { instance, context } = createInstance()
		await instance.init(config({ pollInterval: 0.05 }))
		await vi.waitFor(() =>
			expect(context.updateStatus).toHaveBeenCalledWith(InstanceStatus.ConnectionFailure, expect.any(String)),
		)
		await vi.waitFor(() => expect(fake.requests.length).toBeGreaterThanOrEqual(2))
		// Each attempt stops at the first unanswered request, rather than waiting for all of them to time out
		expect(new Set(fake.queries('getParam.cgi'))).toEqual(new Set(queries([infoQuery()])))
		expect(variables(context)).not.toHaveProperty('firmware')

		fake.unreachable = false
		await vi.waitFor(() => expect(variables(context)).toHaveProperty('firmware', 'V1.13'))
		await vi.waitFor(() => expect(context.updateStatus).toHaveBeenLastCalledWith(InstanceStatus.Ok, null))
	})

	it('shows an error status from the device, but carries on asking', async () => {
		fake.status = 400
		const { instance, context, log } = createInstance()
		await instance.init(config())
		const full = queries(fullQuery(E2260))
		await vi.waitFor(() => expect(fake.requests).toHaveLength(full.length))
		await vi.waitFor(() =>
			expect(context.updateStatus).toHaveBeenLastCalledWith(InstanceStatus.UnknownError, '400: ERR_BAD_REQUEST'),
		)
		// Logged as an error once, not for every request
		expect(log.mock.calls.filter(([level]) => level === 'error')).toHaveLength(1)
	})
})

describe('actions', () => {
	it('sends a set, and a get shows what changed', async () => {
		const { instance, context } = await started()
		const defs = definedActions(context)
		await runAction(defs, ActionId.SetDoStatus, { do: [1, 2], status: 1 })
		expect(fake.queries('setParam.cgi')).toEqual(['DOStatus_01=1&DOStatus_02=1'])
		await runAction(defs, ActionId.GetDoStatus)
		expect(instance.state.outputs.map((o) => o.status)).toEqual([false, true, true, false])
	})

	it('drops a request the action no longer wants before it is sent', async () => {
		const { context, log } = await started()
		const defs = definedActions(context)
		fake.hold()
		// Occupies the queue, so the set waits behind it
		const get = runAction(defs, ActionId.GetDoMode)
		await vi.waitFor(() => expect(fake.queries('getParam.cgi').at(-1)).toMatch(/^DOMode_00/))
		const controller = new AbortController()
		const set = runAction(defs, ActionId.SetDoStatus, { do: [0], status: 1 }, controller.signal)
		controller.abort()
		fake.release()
		await Promise.all([get, set])
		await sleep(150)
		expect(fake.queries('setParam.cgi')).toEqual([])
		expect(log).toHaveBeenCalledWith('debug', 'setParam.cgi?DOStatus_00=1 aborted')
	})

	it('drops the requests still queued when destroyed', async () => {
		const { instance, context } = await started()
		const defs = definedActions(context)
		const before = fake.requests.length
		fake.hold()
		const runs = [
			runAction(defs, ActionId.GetDoStatus),
			runAction(defs, ActionId.GetDoMode),
			runAction(defs, ActionId.GetDoPulseStart),
		]
		await vi.waitFor(() => expect(fake.requests).toHaveLength(before + 1))
		await instance.destroy()
		fake.release()
		await Promise.all(runs)
		await sleep(250)
		expect(fake.requests).toHaveLength(before + 1)
	})

	it('warns rather than sending, when not connected', async () => {
		const { instance, context, log } = createInstance()
		await instance.init(config({ host: '' }))
		await runAction(definedActions(context), ActionId.GetDoStatus)
		expect(log).toHaveBeenCalledWith('warn', expect.stringMatching(/^Not connected/))
	})
})
