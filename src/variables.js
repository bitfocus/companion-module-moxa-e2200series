//import { choices } from './consts.js'

export async function UpdateVariableDefinitions(self) {
	let variableList = []
	variableList.push(
		{ variableId: `date`, name: `Date` },
		{ variableId: `time`, name: `Time` },
		{ variableId: `location`, name: `Location` },
		{ variableId: `description`, name: `Description` },
		{ variableId: `firmware`, name: `Firmware Version` },
		{ variableId: `model`, name: `Model Name` },
		{ variableId: `serial`, name: `Serial Number` },
		{ variableId: `macAddr`, name: `MAC Address` },
		{ variableId: `IP`, name: `IP Address` },
	)
	if (self.moxa.di.length > 0) {
		for (let i = 0; i < self.moxa.inputsDigital.length; i++) {
			variableList.push({ variableId: `count_input_${i}`, name: `DI: Counter ${i}` })
			variableList.push({ variableId: `filter_input_${i}`, name: `DI: Filter ${i}` })
		}
	}
	for (let i = 0; i < self.moxa.outputsDigital.length; i++) {
		variableList.push({ variableId: `lowWidth_output_${i}`, name: `DO: Pulse Low Width ${i}` })
		variableList.push({ variableId: `highWidth_output_${i}`, name: `DO: Pulse High Width ${i}` })
	}

	self.setVariableDefinitions(variableList)
}
