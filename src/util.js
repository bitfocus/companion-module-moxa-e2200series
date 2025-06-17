import { cmd } from './consts.js'

export function buildMsg(path, msgCmd, dios, param) {
	if (!Array.isArray(dios)) {
		if (!isNaN(dios)) {
			let i = dios
			dios = []
			dios[0] = i
		} else {
			this.log('warn', `buildMsg was passed invalid params`)
			return undefined
		}
	}
	let msg = path
	for (let i = 0; i < dios.length; i++) {
		msg = msg !== path ? msg + cmd.char.ampersand : msg
		msg += msgCmd + dios[i].toString(10).padStart(2, cmd.char.pad) + cmd.char.eq + param
	}
	if (this.config.verbose) {
		this.log('debug', `Message Built: ${msg}`)
	}
	return msg
}

export async function sendMsg(msg) {
	if (msg === undefined) {
		return undefined
	}
	await this.queue.add(async () => {
		if (this.axios) {
			try {
				const response = await this.axios.get(msg)
				this.logResponse(response)
			} catch (error) {
				this.logError(error)
			}
		} else {
			this.log('warn', `Axios Client has not been initialised. Message ${msg} not sent`)
		}
	})
}

export async function queryOnConnect() {
	const w = cmd.char.eq + cmd.char.query
	const q = w + cmd.char.ampersand
	const outputs = Object.keys(this.moxa.outputsDigital)
	await this.sendMsg(
		cmd.get.path +
			cmd.get.date +
			q +
			cmd.get.time +
			q +
			cmd.get.location +
			q +
			cmd.get.description +
			q +
			cmd.get.firmware +
			q +
			cmd.get.model +
			q +
			cmd.get.serial +
			q +
			cmd.get.macAddr +
			q +
			cmd.get.ip +
			w,
	)
	await this.sendMsg(this.buildMsg(cmd.get.path, cmd.set.do.lowWidth, outputs, cmd.char.query))
	await this.sendMsg(this.buildMsg(cmd.get.path, cmd.get.do.highWidth, outputs, cmd.char.query))
	if (this.moxa.di.length > 0) {
		const inputs = Object.keys(this.moxa.inputsDigital)
		await this.sendMsg(this.buildMsg(cmd.get.path, cmd.get.di.count, inputs, cmd.char.query))
		await this.sendMsg(this.buildMsg(cmd.get.path, cmd.get.di.filter, inputs, cmd.char.query))
	}
}
