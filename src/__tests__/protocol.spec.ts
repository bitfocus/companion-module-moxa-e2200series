import { describe, expect, it } from 'vitest'
import { PollData } from '../consts.js'
import {
	DiParam,
	DoParam,
	fullQuery,
	getChannels,
	infoQuery,
	parseReply,
	pollQuery,
	setChannels,
	timeQuery,
} from '../protocol.js'

describe('messages', () => {
	it('asks for a parameter of each channel, numbered in two digits', () => {
		expect(getChannels(DoParam.status, [0, 1, 11])).toBe('getParam.cgi?DOStatus_00=?&DOStatus_01=?&DOStatus_11=?')
	})

	it('sets a parameter of each channel to the same value', () => {
		expect(setChannels(DiParam.filter, [2, 3], 100)).toBe('setParam.cgi?DIFilter_02=100&DIFilter_03=100')
	})

	it('asks for the device information', () => {
		expect(infoQuery()).toBe('getParam.cgi?DATE=?&TIME=?&LOC=?&DESC=?&FWR_V=?&MOD_NAME=?&SN_NUM=?&MAC_ADDR=?&IP=?')
	})

	it('asks for the time and date with one & between them', () => {
		// The poll used to send TIME=?&&DATE=?
		expect(timeQuery()).toBe('getParam.cgi?TIME=?&DATE=?')
	})
})

describe('fullQuery', () => {
	it('asks for the information and every parameter of every channel', () => {
		const messages = fullQuery({ inputs: 2, outputs: 1 })
		expect(messages).toEqual([
			infoQuery(),
			'getParam.cgi?DOStatus_00=?',
			'getParam.cgi?DOMode_00=?',
			'getParam.cgi?DOPulseStart_00=?',
			'getParam.cgi?DOLowWidth_00=?',
			'getParam.cgi?DOHighWidth_00=?',
			'getParam.cgi?DIStatus_00=?&DIStatus_01=?',
			'getParam.cgi?DIMode_00=?&DIMode_01=?',
			'getParam.cgi?DITrigger_00=?&DITrigger_01=?',
			'getParam.cgi?DICntStart_00=?&DICntStart_01=?',
			'getParam.cgi?DICNT_00=?&DICNT_01=?',
			'getParam.cgi?DIFilter_00=?&DIFilter_01=?',
		])
	})

	it('asks for no inputs on a model with none', () => {
		expect(fullQuery({ inputs: 0, outputs: 4 }).filter((m) => m.includes('DI'))).toEqual([])
	})
})

describe('pollQuery', () => {
	it('always asks for the time and date, then what the config chose', () => {
		expect(pollQuery({ inputs: 1, outputs: 1 }, [])).toEqual([timeQuery()])
		expect(pollQuery({ inputs: 1, outputs: 1 }, [PollData.DoPulse, PollData.DiCount])).toEqual([
			timeQuery(),
			'getParam.cgi?DICNT_00=?',
			'getParam.cgi?DOPulseStart_00=?',
		])
	})

	it('asks for every choice', () => {
		const all = Object.values(PollData)
		expect(pollQuery({ inputs: 1, outputs: 1 }, all)).toEqual([
			timeQuery(),
			'getParam.cgi?DIStatus_00=?',
			'getParam.cgi?DICNT_00=?',
			'getParam.cgi?DICntStart_00=?',
			'getParam.cgi?DOStatus_00=?',
			'getParam.cgi?DOPulseStart_00=?',
		])
	})

	it('asks for no inputs on a model with none, whatever the config chose', () => {
		expect(pollQuery({ inputs: 0, outputs: 1 }, Object.values(PollData))).toEqual([
			timeQuery(),
			'getParam.cgi?DOStatus_00=?',
			'getParam.cgi?DOPulseStart_00=?',
		])
	})
})

describe('parseReply', () => {
	it('splits a reply into its parameters', () => {
		expect(parseReply('DOStatus_00=1<br>DOStatus_11=0<br>FWR_V=V1.13<br>DATE=2026/11/08<br>')).toEqual([
			{ key: 'DOStatus_00', name: 'DOStatus', channel: 0, value: '1' },
			{ key: 'DOStatus_11', name: 'DOStatus', channel: 11, value: '0' },
			{ key: 'FWR_V', name: 'FWR', channel: undefined, value: 'V1.13' },
			{ key: 'DATE', name: 'DATE', channel: undefined, value: '2026/11/08' },
		])
	})

	it('keeps an = in a value', () => {
		// Split on every =, a location holding one was dropped
		expect(parseReply('LOC=Rack=3<br>')).toEqual([{ key: 'LOC', name: 'LOC', channel: undefined, value: 'Rack=3' }])
	})

	it('trims whitespace, such as a line ending after the last parameter', () => {
		expect(parseReply('DOStatus_00=1<br>DATE=2026/11/08\r\n')).toEqual([
			{ key: 'DOStatus_00', name: 'DOStatus', channel: 0, value: '1' },
			{ key: 'DATE', name: 'DATE', channel: undefined, value: '2026/11/08' },
		])
	})

	it('drops quotes, and anything that is not key=value', () => {
		expect(parseReply('"DOStatus_00=1"<br><br>junk')).toEqual([
			{ key: 'DOStatus_00', name: 'DOStatus', channel: 0, value: '1' },
		])
	})
})
