import { describe, expect, it } from 'vitest'
import { FeedbackId, feedbacksFor } from '../feedbacks.js'
import { checkFeedback, fakeInstance, feedbackDefinition, feedbackDefinitions } from './fixtures.js'

describe('feedbacks', () => {
	it('shows the outputs', () => {
		const fake = fakeInstance(0)
		const defs = feedbackDefinitions(fake)
		fake.state.outputs[2] = { status: true, mode: 1, pulseStart: true }
		expect(checkFeedback(defs, FeedbackId.DoStatus, { do: 2 })).toBe(true)
		expect(checkFeedback(defs, FeedbackId.DoStatus, { do: 1 })).toBe(false)
		expect(checkFeedback(defs, FeedbackId.DoMode, { do: 2, mode: 1 })).toBe(true)
		expect(checkFeedback(defs, FeedbackId.DoMode, { do: 2, mode: 0 })).toBe(false)
		expect(checkFeedback(defs, FeedbackId.DoPulse, { do: 2 })).toBe(true)
	})

	it('shows the inputs', () => {
		const fake = fakeInstance(0)
		const defs = feedbackDefinitions(fake)
		fake.state.inputs[4] = { status: true, mode: 1, trigger: 2, cntStart: true }
		expect(checkFeedback(defs, FeedbackId.DiStatus, { di: 4 })).toBe(true)
		expect(checkFeedback(defs, FeedbackId.DiCntStart, { di: 4 })).toBe(true)
		expect(checkFeedback(defs, FeedbackId.DiMode, { di: 4, mode: 1 })).toBe(true)
		expect(checkFeedback(defs, FeedbackId.DiMode, { di: 4, mode: 0 })).toBe(false)
	})

	it('DI Trigger compares the trigger, not the mode', () => {
		// It used to compare the input's mode with the chosen trigger
		const fake = fakeInstance(0)
		const defs = feedbackDefinitions(fake)
		fake.state.inputs[0] = { mode: 0, trigger: 2 }
		expect(checkFeedback(defs, FeedbackId.DiTrigger, { di: 0, mode: 2 })).toBe(true)
		expect(checkFeedback(defs, FeedbackId.DiTrigger, { di: 0, mode: 0 })).toBe(false)
	})

	it('shows nothing before the device reports, rather than matching the first choice', () => {
		const defs = feedbackDefinitions(fakeInstance(0))
		expect(checkFeedback(defs, FeedbackId.DoMode, { do: 0, mode: 0 })).toBe(false)
		expect(checkFeedback(defs, FeedbackId.DiTrigger, { di: 0, mode: 0 })).toBe(false)
		expect(checkFeedback(defs, FeedbackId.DoStatus, { do: 0 })).toBe(false)
	})

	it('shows false for a channel this model does not have, rather than throwing', () => {
		// A feedback set up for an e2210 keeps its channel when the config changes to a smaller model
		const defs = feedbackDefinitions(fakeInstance(4))
		expect(checkFeedback(defs, FeedbackId.DoStatus, { do: 7 })).toBe(false)
		expect(checkFeedback(defs, FeedbackId.DoMode, { do: 'x', mode: 0 })).toBe(false)
	})

	it('offers no input feedbacks on a model with no inputs', () => {
		const defs = feedbackDefinitions(fakeInstance(5))
		for (const id of [FeedbackId.DiStatus, FeedbackId.DiCntStart, FeedbackId.DiMode, FeedbackId.DiTrigger]) {
			expect(defs[id], id).toBeUndefined()
		}
		expect(defs[FeedbackId.DoStatus]).toBeDefined()
	})

	it('offers the channels of the model', () => {
		const defs = feedbackDefinitions(fakeInstance(2))
		const channel = feedbackDefinition(defs, FeedbackId.DiStatus).options[0]
		expect(channel).toMatchObject({ type: 'dropdown', default: 0 })
		expect(channel.type === 'dropdown' && channel.choices.map((c) => c.id)).toEqual([0, 1, 2, 3, 4, 5])
	})

	it('names the feedback showing each field', () => {
		expect(feedbacksFor(['doStatus', 'diTrigger', 'doStatus'])).toEqual([FeedbackId.DoStatus, FeedbackId.DiTrigger])
		expect(feedbacksFor([])).toEqual([])
	})
})
