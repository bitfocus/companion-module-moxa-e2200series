import { describe, expect, it } from 'vitest'
import type {
	CompanionMigrationAction,
	CompanionStaticUpgradeProps,
	CompanionUpgradeContext,
} from '@companion-module/base'
import { UpgradeScripts, channelListActionOptionsApi2, numericActionOptionsApi2 } from '../upgrades.js'
import { ActionId } from '../actions.js'
import type { ModuleConfig } from '../config.js'
import { actionDefinitions, definition, fakeInstance } from './fixtures.js'

/**
 * Upgrade scripts are order-sensitive: a stored upgrade index records how far a configuration has been migrated, so
 * scripts may only ever be appended. Pin the indexes rather than taking the last entry, so appending a script can't
 * silently retarget this suite.
 */
const API2_SCRIPT_INDEX = 0
const EXPECTED_SCRIPT_COUNT = 1

// Options reach upgrade scripts already wrapped as ExpressionOrValue — Companion does that before running them
const v = (value: unknown) => ({ isExpression: false, value })
const expr = (value: string) => ({ isExpression: true, value })

function action(actionId: string, options: Record<string, unknown>): CompanionMigrationAction {
	return {
		id: `action-${actionId}`,
		controlId: 'bank-1',
		actionId,
		options: options as CompanionMigrationAction['options'],
	}
}

const CONFIG: ModuleConfig = { model: 0, host: '10.0.0.1', pollInterval: 5, poll: [0, 3], verbose: false }

function run(index: number, actions: CompanionMigrationAction[], config: ModuleConfig | null = null) {
	const context: CompanionUpgradeContext<ModuleConfig> = { currentConfig: config ?? CONFIG }
	return UpgradeScripts[index](context, {
		config,
		secrets: null,
		actions,
		feedbacks: [],
	} satisfies CompanionStaticUpgradeProps<ModuleConfig, undefined>)
}

it('the scripts sit at the indexes this suite targets', () => {
	// Appending a script is fine — bump EXPECTED_SCRIPT_COUNT. Never insert, reorder or remove one.
	expect(UpgradeScripts).toHaveLength(EXPECTED_SCRIPT_COUNT)
})

describe('API 2.x upgrade script', () => {
	it('makes numbers of the width and filter options, and expressions of their variables', () => {
		const actions = [
			action(ActionId.SetDoLowWidth, { do: v([0]), lowWidth: v('100') }),
			action(ActionId.SetDoHighWidth, { do: v([0]), highWidth: v('$(local:width)') }),
			action(ActionId.SetDiFilter, { di: v([1]), filter: v('$(moxa:a)0') }),
			action(ActionId.SetDiFilter, { di: v([1]), filter: v('2.5') }),
		]
		const result = run(API2_SCRIPT_INDEX, actions)
		expect(result.updatedActions).toEqual(actions)
		expect(actions.map((a) => a.options.lowWidth ?? a.options.highWidth ?? a.options.filter)).toEqual([
			v(100),
			expr('$(local:width)'),
			expr('parseVariables("$(moxa:a)0")'),
			v(2.5),
		])
	})

	it('wraps a lone channel in an array', () => {
		const actions = [
			action(ActionId.SetDoStatus, { do: v(0), status: v(1) }),
			action(ActionId.SetDiTrigger, { di: v(3), mode: v(2) }),
			action(ActionId.SetDoLowWidth, { do: v(2), lowWidth: v(50) }),
		]
		const result = run(API2_SCRIPT_INDEX, actions)
		expect(result.updatedActions).toEqual(actions)
		expect(actions.map((a) => a.options.do ?? a.options.di)).toEqual([v([0]), v([3]), v([2])])
	})

	it('reports only the actions it changed', () => {
		const actions = [
			action(ActionId.SetDoStatus, { do: v([0, 1]), status: v(1) }),
			action(ActionId.SetDoLowWidth, { do: v([0]), lowWidth: v(100) }),
			action(ActionId.SetDiFilter, { di: expr('$(local:x)'), filter: expr('$(local:y)') }),
			action(ActionId.GetDoStatus, {}),
			action('someOtherAction', { do: v(0), filter: v('3') }),
		]
		expect(run(API2_SCRIPT_INDEX, actions).updatedActions).toEqual([])
	})

	it('leaves the config as it is', () => {
		expect(run(API2_SCRIPT_INDEX, [], CONFIG).updatedConfig).toBeNull()
	})

	it('lists options that are what the definitions now make them', () => {
		const defs = actionDefinitions(fakeInstance(0))
		const field = (id: ActionId, key: string) => definition(defs, id).options.find((o) => o.id === key)
		for (const [id, keys] of Object.entries(numericActionOptionsApi2)) {
			for (const key of keys) expect(field(id as ActionId, key), `${id}.${key}`).toMatchObject({ type: 'number' })
		}
		for (const [id, keys] of Object.entries(channelListActionOptionsApi2)) {
			for (const key of keys) {
				expect(field(id as ActionId, key), `${id}.${key}`).toMatchObject({ type: 'multidropdown' })
			}
		}
	})
})
