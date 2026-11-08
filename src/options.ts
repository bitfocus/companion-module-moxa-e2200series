import type {
	CompanionInputFieldDropdown,
	CompanionInputFieldMultiDropdown,
	DropdownChoice,
	JsonValue,
} from '@companion-module/base'

/** Several outputs, for an action to change at once */
export function outputsOption(choices: DropdownChoice<number>[]): CompanionInputFieldMultiDropdown<'do', number> {
	return {
		id: 'do',
		type: 'multidropdown',
		label: 'DO',
		default: choices.length > 0 ? [choices[0].id] : [],
		choices,
		minSelection: 1,
		tooltip: 'Select DOs to change',
	}
}

/** Several inputs, for an action to change at once */
export function inputsOption(choices: DropdownChoice<number>[]): CompanionInputFieldMultiDropdown<'di', number> {
	return {
		id: 'di',
		type: 'multidropdown',
		label: 'DI',
		default: choices.length > 0 ? [choices[0].id] : [],
		choices,
		minSelection: 1,
		tooltip: 'Select DIs to change',
	}
}

/** One output, for a feedback to show */
export function outputOption(choices: DropdownChoice<number>[]): CompanionInputFieldDropdown<'do', number> {
	return {
		id: 'do',
		type: 'dropdown',
		label: 'DO',
		// The first output. The choices depend on the model, so there is no fixed list to index
		default: choices[0]?.id ?? 0,
		choices,
	}
}

/** One input, for a feedback to show */
export function inputOption(choices: DropdownChoice<number>[]): CompanionInputFieldDropdown<'di', number> {
	return {
		id: 'di',
		type: 'dropdown',
		label: 'DI',
		// The first input. The choices depend on the model, so there is no fixed list to index
		default: choices[0]?.id ?? 0,
		choices,
	}
}

/** A dropdown of fixed choices, all numbers */
export function choiceOption<TKey extends string, TId extends number>(
	id: TKey,
	label: string,
	choices: readonly DropdownChoice<TId>[],
): CompanionInputFieldDropdown<TKey, TId> {
	return { id, type: 'dropdown', label, default: choices[0].id, choices: [...choices] }
}

/**
 * The channels an option selects that this model has, without repeats. An expression can give one channel or an array,
 * and an action saved before UpgradeScripts[0] that was never edited holds one channel rather than an array.
 */
export function channelsValue(value: JsonValue | undefined, count: number): number[] {
	const values = Array.isArray(value) ? value : [value]
	const channels = values.map((v) => (typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v) : v))
	return [
		...new Set(
			channels.filter((c): c is number => typeof c === 'number' && Number.isInteger(c) && c >= 0 && c < count),
		),
	]
}

/** The choice an option holds, or undefined if it holds none of them. An expression can give anything */
export function choiceValue<TId extends number>(
	value: JsonValue | undefined,
	choices: readonly DropdownChoice<TId>[],
): TId | undefined {
	return choices.find((choice) => choice.id === value)?.id
}

/**
 * A time in ms, in the device's units of 0.5 ms
 * @returns undefined if it isn't a number between min and max
 */
export function halfMsValue(value: JsonValue | undefined, min: number, max: number): number | undefined {
	if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) return undefined
	return Math.floor(value * 2)
}
