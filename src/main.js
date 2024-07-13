import { InstanceBase, runEntrypoint, InstanceStatus } from '@companion-module/base'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import  {UpdateVariableDefinitions } from './variables.js'
import * as config from './config.js'
import { choices } from './consts.js'
import * as logging from './logging.js'
import * as polling from './polling.js'
import * as response from './parseResponse.js'
import * as utils from './util.js'
import axios from 'axios'

const timeOut = 5000

class ioLogik_E2200 extends InstanceBase {
	constructor(internal) {
		super(internal)
		Object.assign(this, { ...config, ...logging, ...polling, ...response, ...utils })
	}

	async init(config) {
		this.configUpdated(config)	
	}

	// When module gets deleted
	async destroy() {
		this.log('debug', `destroy: ${this.id}`)
		this.stopPolling()
		if (this.axios) {
			delete this.axios
		}
		delete this.moxa
	}
	
	async configUpdated(config) {
		this.stopPolling()
		this.config = config
		if (this.moxa) {
			delete this.moxa
		}
		this.moxa = {
			inputs: [],
			outputs: [],
			di: [],
			do: [],
		}
		switch (this.config.model) {
			case choices.device[0].id:
				this.moxa.inputs = choices.e2210inputs
				this.moxa.outputs = choices.e2210outputs
				break
			case choices.device[1].id:
				this.moxa.inputs = choices.e2212inputs
				this.moxa.outputs = choices.e2212outputs
				break
			case choices.device[2].id:
				this.moxa.inputs = choices.e2214inputs
				this.moxa.outputs = choices.e2214outputs
				break
			case choices.device[3].id:
				this.moxa.inputs = choices.e2242inputs
				this.moxa.outputs = choices.e2242outputs
				break
			case choices.device[4].id:
				this.moxa.inputs = choices.e2260inputs
				this.moxa.outputs = choices.e2260outputs
				break
			case choices.device[5].id:
				this.moxa.inputs = choices.e2262inputs
				this.moxa.outputs = choices.e2262outputs
				break
			default:
				this.updateStatus(InstanceStatus.BadConfig)
				this.log('error', `Unrecognised device selection: ${this.config.device}`)
				return undefined
		}
		if (this.config.model !== choices.device[4].id && this.config.model !== choices.device[5].id) {
			const inputs = Object.keys(this.moxa.inputs)
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
		const outputs = Object.keys(this.moxa.outputs)
		for (const o in outputs) {
			this.moxa.do[o] = {
				mode: false,
				status: false,
				pulseStart: false,	
			}
		}
		this.updateStatus(InstanceStatus.Connecting)
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
			this.updateStatus(InstanceStatus.BadConfig)
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
