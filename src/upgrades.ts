import {
	FixupNumericOrVariablesValueToExpressions,
	type CompanionMigrationAction,
	type CompanionStaticUpgradeProps,
	type CompanionStaticUpgradeResult,
	type CompanionStaticUpgradeScript,
	type CompanionUpgradeContext,
	type ExpressionOrValue,
	type JsonValue,
} from '@companion-module/base'
import type { ModuleConfig } from './config.js'
import { ActionId } from './actions.js'

type OptionValue = ExpressionOrValue<JsonValue | undefined> | undefined

/**
 * Options that were text inputs parsed as numbers before the API 2.x migration, so could hold a number typed as a
 * string, or variables. They are number fields since. Frozen history for UpgradeScripts[0]: do not edit to track later
 * changes, add a new script instead.
 */
export const numericActionOptionsApi2: Partial<Record<ActionId, string[]>> = {
	[ActionId.SetDoLowWidth]: ['lowWidth'],
	[ActionId.SetDoHighWidth]: ['highWidth'],
	[ActionId.SetDiFilter]: ['filter'],
}

/**
 * Multi-dropdowns whose default before API 2.x was a single channel, not an array, so an action never edited holds one.
 * Frozen history for UpgradeScripts[0], as {@link numericActionOptionsApi2} is.
 */
export const channelListActionOptionsApi2: Partial<Record<ActionId, string[]>> = {
	[ActionId.SetDoStatus]: ['do'],
	[ActionId.SetDoMode]: ['do'],
	[ActionId.SetDoPulseStart]: ['do'],
	[ActionId.SetDoLowWidth]: ['do'],
	[ActionId.SetDoHighWidth]: ['do'],
	[ActionId.SetDiMode]: ['di'],
	[ActionId.SetDiTrigger]: ['di'],
	[ActionId.SetDiCntStart]: ['di'],
	[ActionId.SetDiFilter]: ['di'],
}

/** Whether the helper changed a value. It always hands back a fresh object, so this compares contents, not identity */
function isChanged(current: OptionValue, fixed: OptionValue): boolean {
	return fixed?.isExpression !== current?.isExpression || fixed?.value !== current?.value
}

/** Converts the listed options in place. Returns whether anything changed */
function fixupNumericOptions(action: CompanionMigrationAction, keys?: string[]): boolean {
	if (!keys) return false
	let changed = false
	for (const key of keys) {
		const current = action.options[key]
		const fixed = FixupNumericOrVariablesValueToExpressions(current)
		if (isChanged(current, fixed)) {
			action.options[key] = fixed
			changed = true
		}
	}
	return changed
}

/** Wraps a lone channel in an array. Returns whether anything changed */
function fixupChannelListOptions(action: CompanionMigrationAction, keys?: string[]): boolean {
	if (!keys) return false
	let changed = false
	for (const key of keys) {
		const current = action.options[key]
		if (current === undefined || current.isExpression || typeof current.value !== 'number') continue
		action.options[key] = { isExpression: false, value: [current.value] }
		changed = true
	}
	return changed
}

export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig, undefined>[] = [
	/*
	 * Place your upgrade scripts here
	 * Remember that once it has been added it cannot be removed!
	 */

	// 0: API 2.x — the pulse width and filter text inputs became number fields. "3" becomes 3, "$(local:x)" becomes an
	// expression, anything else is wrapped in parseVariables(). A channel multi-dropdown holding one channel, as one
	// never edited does, holds an array of it.
	function api2(
		_context: CompanionUpgradeContext<ModuleConfig>,
		props: CompanionStaticUpgradeProps<ModuleConfig, undefined>,
	): CompanionStaticUpgradeResult<ModuleConfig, undefined> {
		return {
			updatedConfig: null,
			updatedActions: props.actions.filter((action) => {
				const id = action.actionId as ActionId
				const numeric = fixupNumericOptions(action, numericActionOptionsApi2[id])
				const channels = fixupChannelListOptions(action, channelListActionOptionsApi2[id])
				return numeric || channels
			}),
			updatedFeedbacks: [],
		}
	},
]
