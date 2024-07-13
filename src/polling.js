import { choices, cmd } from './consts.js'

export function startPolling() {
	if (this.pollTimer) {
		clearTimeout(this.pollTimer)
	}
	if (this.config.pollInterval > 0) {
		this.pollTimer = setTimeout(() => {
			this.pollStatus()
		}, this.config.pollInterval * 1000)
		return true
	} else {
		delete this.pollTimer
		return undefined
	}
}

export function stopPolling() {
	if (this.pollTimer) {
		clearTimeout(this.pollTimer)
		delete this.pollTimer
		return true
	}
	return undefined
}

export async function pollStatus() {
	if (this.axios) {
		const w = cmd.char.eq + cmd.char.query
		const q = w + cmd.char.ampersand
		await this.sendMsg(cmd.get.path + cmd.get.time + q + cmd.char.ampersand + cmd.get.date + w)
		const outputs = Object.keys(this.moxa.outputsDigital)
		if (this.moxa.di.length > 0) {
			const inputs = Object.keys(this.moxa.inputsDigital)
			if (this.config.poll.includes(choices.polling[0].id)){
				await this.sendMsg(this.buildMsg(cmd.get.path, cmd.get.di.status, inputs, cmd.char.query))
			}
			if (this.config.poll.includes(choices.polling[1].id)){
				await this.sendMsg(this.buildMsg(cmd.get.path, cmd.get.di.count, inputs, cmd.char.query))
			}
			if (this.config.poll.includes(choices.polling[2].id)){
				await this.sendMsg(this.buildMsg(cmd.get.path, cmd.get.di.countStart, inputs, cmd.char.query))
			}
		}
		if (this.config.poll.includes(choices.polling[3].id)){
			await this.sendMsg(this.buildMsg(cmd.get.path, cmd.get.do.status, outputs, cmd.char.query))
		}
		if (this.config.poll.includes(choices.polling[4].id)){
			await this.sendMsg(this.buildMsg(cmd.get.path, cmd.get.do.pulseStart, outputs, cmd.char.query))
		}
	}
	this.startPolling()
}
