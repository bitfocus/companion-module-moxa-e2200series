import { choices } from './consts.js'

export async function UpdateVariableDefinitions (self) {
	let variableList = []
	if (self.config.device === choices.device[0].id) {
		for (let i = 0; i < self.config.counter_e2210.length; i++) {
			variableList.push({ variableId: `count_input_${self.config.counter_e2210[1]}`, name: `Counter: Input ${self.config.counter_e2210[1]}` })
			
		}
	} else if (self.config.device === choices.device[1].id) {
		for (let i = 0; i < self.config.counter_e2212.length; i++) {
			variableList.push({ variableId: `count_input_${self.config.counter_e2212[1]}`, name: `Counter: Input ${self.config.counter_e2210[1]}` })
			
		}
	}
	self.setVariableDefinitions(variableList)
}
