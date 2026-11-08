import { vi } from 'vitest'
import type {
	CompanionActionCallbackContext,
	CompanionActionContext,
	CompanionActionDefinitions,
	CompanionActionEvent,
	CompanionActionInfo,
	CompanionFeedbackBooleanEvent,
	CompanionFeedbackCallbackContext,
	CompanionFeedbackDefinitions,
	CompanionOptionValues,
	SomeCompanionActionInputField,
	SomeCompanionFeedbackInputField,
} from '@companion-module/base'
import type MoxaE2200Instance from '../main.js'
import { modelChannels, type Model } from '../consts.js'
import { DeviceState } from '../state.js'
import { UpdateActions, type ActionId, type ActionSchema } from '../actions.js'
import { UpdateFeedbacks, type FeedbackId, type FeedbackSchema } from '../feedbacks.js'

function createMocks() {
	return {
		send: vi.fn<MoxaE2200Instance['send']>(async () => {}),
		log: vi.fn<MoxaE2200Instance['log']>(),
		setActionDefinitions: vi.fn<(defs: CompanionActionDefinitions<ActionSchema>) => void>(),
		setFeedbackDefinitions: vi.fn<(defs: CompanionFeedbackDefinitions<FeedbackSchema>) => void>(),
	}
}

export type FakeInstance = { self: MoxaE2200Instance; state: DeviceState } & ReturnType<typeof createMocks>

/**
 * A plain object standing in for the instance, for the definitions to be built from. Everything that would reach
 * Companion or the device is a mock.
 */
export function fakeInstance(model: Model = 0): FakeInstance {
	const counts = modelChannels(model)
	if (counts === undefined) throw new Error(`No model ${model}`)
	const mocks = createMocks()
	const state = new DeviceState(counts)
	const self = { state, ...mocks } as unknown as MoxaE2200Instance
	return { self, state, ...mocks }
}

export function actionDefinitions(fake: FakeInstance): CompanionActionDefinitions<ActionSchema> {
	UpdateActions(fake.self)
	return fake.setActionDefinitions.mock.calls[0][0]
}

export function feedbackDefinitions(fake: FakeInstance): CompanionFeedbackDefinitions<FeedbackSchema> {
	UpdateFeedbacks(fake.self)
	return fake.setFeedbackDefinitions.mock.calls[0][0]
}

// The definitions' hooks are typed per action. These take any options, as the values Companion passes are not checked
type AnyCallback = (event: CompanionActionEvent, context: CompanionActionCallbackContext) => Promise<void> | void
type AnySubscribe = (event: CompanionActionInfo, context: CompanionActionContext) => Promise<void> | void

/** An action definition, with its options and hooks typed for any action */
export interface AnyActionDefinition {
	options: SomeCompanionActionInputField[]
	optionsToMonitorForSubscribe?: string[]
	callback: AnyCallback
	subscribe?: AnySubscribe
}

/** @throws if the action is not defined */
export function definition(defs: CompanionActionDefinitions<ActionSchema>, actionId: ActionId): AnyActionDefinition {
	const def = defs[actionId]
	if (!def) throw new Error(`${actionId} is not defined`)
	return def as unknown as AnyActionDefinition
}

/** Runs an action's callback as Companion would, with the option values already resolved */
export async function runAction(
	defs: CompanionActionDefinitions<ActionSchema>,
	actionId: ActionId,
	options: CompanionOptionValues = {},
	signal = new AbortController().signal,
): Promise<void> {
	const event: CompanionActionEvent = {
		id: `action-${actionId}`,
		controlId: 'bank-1',
		actionId,
		surfaceId: undefined,
		options,
	}
	await definition(defs, actionId).callback(event, { type: 'action', signal } as never)
}

/** Runs an action's subscribe hook as Companion would, with the option values already resolved */
export async function subscribeAction(
	defs: CompanionActionDefinitions<ActionSchema>,
	actionId: ActionId,
	options: CompanionOptionValues = {},
): Promise<void> {
	const subscribe = definition(defs, actionId).subscribe
	if (!subscribe) throw new Error(`${actionId} has no subscribe`)
	const event: CompanionActionInfo = { id: `action-${actionId}`, controlId: 'bank-1', actionId, options }
	await subscribe(event, { type: 'action' } as never)
}

/** A boolean feedback definition, typed for any feedback */
export interface AnyFeedbackDefinition {
	options: SomeCompanionFeedbackInputField[]
	callback: (event: CompanionFeedbackBooleanEvent, context: CompanionFeedbackCallbackContext) => boolean
}

/** @throws if the feedback is not defined */
export function feedbackDefinition(
	defs: CompanionFeedbackDefinitions<FeedbackSchema>,
	feedbackId: FeedbackId,
): AnyFeedbackDefinition {
	const def = defs[feedbackId]
	if (!def) throw new Error(`${feedbackId} is not defined`)
	return def as unknown as AnyFeedbackDefinition
}

/** Runs a feedback's callback as Companion would, with the option values already resolved */
export function checkFeedback(
	defs: CompanionFeedbackDefinitions<FeedbackSchema>,
	feedbackId: FeedbackId,
	options: CompanionOptionValues,
): boolean {
	const event = {
		id: `feedback-${feedbackId}`,
		controlId: 'bank-1',
		feedbackId,
		options,
	} as CompanionFeedbackBooleanEvent
	return feedbackDefinition(defs, feedbackId).callback(event, {
		type: 'feedback',
		signal: new AbortController().signal,
	} as never)
}
