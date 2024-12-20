import { InstanceBase, runEntrypoint, InstanceStatus } from '@companion-module/base'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdateVariableDefinitions } from './variables.js'
import * as config from './config.js'
import { choices } from './consts.js'
import * as logging from './logging.js'
import * as polling from './polling.js'
import * as response from './parseResponse.js'
import * as utils from './util.js'
import axios from 'axios'
import PQueue from 'p-queue'

const timeOut = 5000

class ioLogik_E2200 extends InstanceBase {
	constructor(internal) {
		super(internal)
		Object.assign(this, { ...config, ...logging, ...polling, ...response, ...utils })
		this.queue = new PQueue({ concurrency: 1, interval: 100, intervalCap: 1 })
		this.currentStatus = { status: InstanceStatus.Disconnected, message: '' }
	}

	checkStatus(status = InstanceStatus.Disconnected, message = '') {
		if (status === this.currentStatus.status && message === this.currentStatus.message) return false
		this.updateStatus(status, message.toString())
		this.currentStatus.status = status
		this.currentStatus.message = message
		return true
	}

	async init(config) {
		this.configUpdated(config)
	}

	// When module gets deleted
	async destroy() {
		this.log('debug', `destroy: ${this.id}`)
		this.stopPolling()
		this.queue.clear()
		if (this.axios) {
			delete this.axios
		}
		delete this.moxa
	}

	async configUpdated(config) {
		this.stopPolling()
		this.queue.clear()
		this.config = config
		if (this.moxa) {
			delete this.moxa
		}
		this.moxa = {
			inputsDigital: [],
			outputsDigital: [],
			di: [],
			do: [],
		}
		switch (this.config.model) {
			case choices.device[0].id:
				this.moxa.inputsDigital = choices.e2210inputsDigital
				this.moxa.outputsDigital = choices.e2210outputsDigital
				break
			case choices.device[1].id:
				this.moxa.inputsDigital = choices.e2212inputsDigital
				this.moxa.outputsDigital = choices.e2212outputsDigital
				break
			case choices.device[2].id:
				this.moxa.inputsDigital = choices.e2214inputsDigital
				this.moxa.outputsDigital = choices.e2214outputsDigital
				break
			case choices.device[3].id:
				this.moxa.inputsDigital = choices.e2242inputsDigital
				this.moxa.outputsDigital = choices.e2242outputsDigital
				break
			case choices.device[4].id:
				this.moxa.inputsDigital = choices.e2260inputsDigital
				this.moxa.outputsDigital = choices.e2260outputsDigital
				break
			case choices.device[5].id:
				this.moxa.inputsDigital = choices.e2262inputsDigital
				this.moxa.outputsDigital = choices.e2262outputsDigital
				break
			default:
				this.checkStatus(InstanceStatus.BadConfig)
				this.log('error', `Unrecognised device selection: ${this.config.device}`) // This should never occur
				return undefined
		}
		if (this.moxa.inputsDigital.length > 0) {
			const inputs = Object.keys(this.moxa.inputsDigital)
			for (const i in inputs) {
				this.moxa.di[i] = {
					mode: false,
					status: false,
					filter: 0,
					trigger: 0,
					cntStart: false,
				}
			}
		}
		const outputs = Object.keys(this.moxa.outputsDigital)
		for (const o in outputs) {
			this.moxa.do[o] = {
				mode: false,
				status: false,
				pulseStart: false,
			}
		}
		this.checkStatus(InstanceStatus.Connecting)
		if (this.setupAxios(this.config.host)) {
			this.queryOnConnect()
		}
		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
		this.startPolling()
	}

	setupAxios(host) {
		if (this.axios) {
			delete this.axios
		}
		if (host) {
			this.axios = axios.create({
				baseURL: `http://${host}/`,
				timeout: timeOut,
			})
			return true
		} else {
			this.log('warn', `Invalid config`)
			this.checkStatus(InstanceStatus.BadConfig)
			return undefined
		}
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}
}

runEntrypoint(ioLogik_E2200, UpgradeScripts)
