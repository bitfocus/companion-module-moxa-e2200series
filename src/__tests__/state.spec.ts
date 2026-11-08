import { describe, expect, it } from 'vitest'
import { parseReply } from '../protocol.js'
import { DeviceState } from '../state.js'

const apply = (state: DeviceState, reply: string) => state.apply(parseReply(reply))

describe('DeviceState', () => {
	it('sets the variables for the device information', () => {
		const { variables } = apply(
			new DeviceState({ inputs: 0, outputs: 4 }),
			'DATE=2026/11/08<br>TIME=16:45:00<br>LOC=Rack 3<br>DESC=Stage<br>FWR_V=V1.13<br>MOD_NAME=E2260<br>SN_NUM=TAH1<br>MAC_ADDR=00:90:E8:12:34:56<br>IP=10.0.0.5<br>',
		)
		expect(variables).toEqual({
			date: '2026/11/08',
			time: '16:45:00',
			location: 'Rack 3',
			description: 'Stage',
			firmware: 'V1.13',
			model: 'E2260',
			serial: 'TAH1',
			macAddr: '00:90:E8:12:34:56',
			IP: '10.0.0.5',
		})
	})

	it('takes in the channels, and reports which fields changed', () => {
		const state = new DeviceState({ inputs: 2, outputs: 2 })
		const result = apply(
			state,
			'DIStatus_01=1<br>DIMode_00=1<br>DITrigger_00=2<br>DICntStart_01=1<br>DOStatus_00=1<br>DOMode_01=1<br>DOPulseStart_01=1<br>',
		)
		expect(state.inputs).toEqual([
			{ mode: 1, trigger: 2 },
			{ status: true, cntStart: true },
		])
		expect(state.outputs).toEqual([{ status: true }, { mode: 1, pulseStart: true }])
		expect([...result.changed].sort()).toEqual([
			'diCntStart',
			'diMode',
			'diStatus',
			'diTrigger',
			'doMode',
			'doPulseStart',
			'doStatus',
		])
		expect(result.unexpected).toEqual([])
	})

	it('reports no change when the values are the ones it had', () => {
		const state = new DeviceState({ inputs: 1, outputs: 1 })
		apply(state, 'DOStatus_00=1<br>DIStatus_00=0<br>')
		expect(apply(state, 'DOStatus_00=1<br>DIStatus_00=0<br>').changed.size).toBe(0)
		expect([...apply(state, 'DOStatus_00=0<br>').changed]).toEqual(['doStatus'])
	})

	it('sets counts as they are, and widths and filters in ms', () => {
		const { variables } = apply(
			new DeviceState({ inputs: 1, outputs: 1 }),
			'DICNT_00=123456<br>DIFilter_00=101<br>DOLowWidth_00=200<br>DOHighWidth_00=1<br>',
		)
		expect(variables).toEqual({
			count_input_0: 123456,
			filter_input_0: 50.5,
			lowWidth_output_0: 100,
			highWidth_output_0: 0.5,
		})
	})

	it('reports a channel this model does not have as unexpected, rather than throwing', () => {
		// The module used to throw a TypeError on these, dropping the rest of the reply
		const state = new DeviceState({ inputs: 0, outputs: 4 })
		const result = apply(state, 'DOStatus_07=1<br>DIStatus_00=1<br>DICNT_00=5<br>DOStatus_03=1<br>')
		expect(result.unexpected).toEqual(['DOStatus_07=1', 'DIStatus_00=1', 'DICNT_00=5'])
		expect(state.outputs[3]).toEqual({ status: true })
		expect(result.variables).toEqual({})
	})

	it('reports an unknown parameter, or a value that is not a number, as unexpected', () => {
		const state = new DeviceState({ inputs: 1, outputs: 1 })
		const result = apply(state, 'DOStatus_00=on<br>WHAT_00=1<br>WHAT=1<br>')
		expect(result.unexpected).toEqual(['DOStatus_00=on', 'WHAT_00=1', 'WHAT=1'])
		expect(state.outputs[0]).toEqual({})
	})

	it('finds a channel only for whole numbers', () => {
		const state = new DeviceState({ inputs: 1, outputs: 1 })
		expect(state.output(0)).toBe(state.outputs[0])
		expect(state.output(0.5)).toBeUndefined()
		expect(state.output('0')).toBeUndefined()
		expect(state.output(1)).toBeUndefined()
		expect(state.input(-1)).toBeUndefined()
	})
})
