import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, pollData, type ModuleConfig } from './config.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionSchema } from './actions.js'
import { feedbacksFor, UpdateFeedbacks, type FeedbackSchema } from './feedbacks.js'
import { UpdateVariableDefinitions, type VariablesSchema } from './variables.js'
import { describeFailure, MoxaClient, REQUEST_TIMEOUT } from './client.js'
import { modelChannels } from './consts.js'
import { fullQuery, parseReply, pollQuery } from './protocol.js'
import { DeviceState } from './state.js'

export type ModuleTypes = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionSchema
	feedbacks: FeedbackSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

export default class MoxaE2200Instance extends InstanceBase<ModuleTypes> {
	config!: ModuleConfig // Setup in init()
	state = new DeviceState({ inputs: 0, outputs: 0 })
	/** Tests shorten it */
	requestTimeout = REQUEST_TIMEOUT
	#client: MoxaClient | undefined
	#pollTimer: NodeJS.Timeout | undefined
	/** Whether the full query has got through since connecting, or since the device was last unreachable */
	#queried = false
	#lastStatus: { status: InstanceStatus; message: string | null } | undefined

	async init(config: ModuleConfig): Promise<void> {
		await this.configUpdated(config)
	}

	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', `destroy: ${this.id}`)
		this.#stop()
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		this.#stop()
		const counts = modelChannels(config.model)
		if (counts === undefined) {
			this.log('error', `Unrecognised model: ${String(config.model)}`)
			this.#status(InstanceStatus.BadConfig, 'Unrecognised model')
			return
		}
		this.state = new DeviceState(counts)
		const configHost: unknown = config.host
		const host = typeof configHost === 'string' ? configHost.trim() : ''
		// Before the definitions, as each action placed queries the device when they are set
		if (host !== '') this.#client = new MoxaClient(host, this.requestTimeout)
		UpdateActions(this)
		UpdateFeedbacks(this)
		UpdateVariableDefinitions(this)
		// The state was cleared, so no feedback should show what it did
		this.checkAllFeedbacks()
		if (this.#client === undefined) {
			this.log('warn', 'No hostname')
			this.#status(InstanceStatus.BadConfig, 'No hostname')
			return
		}
		this.#status(InstanceStatus.Connecting)
		void this.#poll(this.#client)
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	/**
	 * Sends a request, and takes in the reply. Logs rather than throwing if it fails
	 * @param signal an action's context.signal, so a request the user no longer wants is dropped before it is sent
	 */
	async send(path: string, signal?: AbortSignal): Promise<void> {
		const client = this.#client
		if (client === undefined) {
			this.log('warn', `Not connected. ${path} not sent`)
			return
		}
		await this.#request(client, path, signal)
	}

	/** @returns whether the device answered, even with an error status */
	async #request(client: MoxaClient, path: string, signal?: AbortSignal): Promise<boolean> {
		if (this.config.verbose) this.log('debug', `Sending: ${path}`)
		let text: string
		try {
			text = await client.get(path, signal)
		} catch (err) {
			if (client !== this.#client || signal?.aborted) {
				this.log('debug', `${path} aborted`)
				return false
			}
			return this.#onFailure(err)
		}
		// A reply to a request from before the config changed says nothing about the device now configured
		if (client !== this.#client) return false
		this.#onReply(text)
		return true
	}

	#onReply(text: string): void {
		this.#status(InstanceStatus.Ok)
		if (this.config.verbose) this.log('debug', `Data received:\n${text}`)
		const { variables, changed, unexpected } = this.state.apply(parseReply(text))
		for (const param of unexpected) this.log('debug', `unexpected response: ${param}`)
		if (Object.keys(variables).length > 0) this.setVariableValues(variables)
		// Only the feedbacks showing what changed. A poll that changes nothing checks none
		const [first, ...rest] = feedbacksFor(changed)
		if (first !== undefined) this.checkFeedbacks(first, ...rest)
	}

	/** @returns whether the device answered */
	#onFailure(err: unknown): boolean {
		const failure = describeFailure(err)
		let changed: boolean
		switch (failure.type) {
			case 'http':
				changed = this.#status(InstanceStatus.UnknownError, failure.message)
				this.log(changed ? 'error' : 'debug', `${failure.message}\n${failure.detail}`)
				return true
			case 'unreachable':
				// Everything is asked for again once it answers, as it may have changed meanwhile
				this.#queried = false
				changed = this.#status(InstanceStatus.ConnectionFailure, failure.message)
				this.log(changed ? 'error' : 'debug', failure.message)
				return false
			case 'other':
				changed = this.#status(InstanceStatus.UnknownError, failure.message)
				this.log(changed ? 'error' : 'debug', failure.message)
				return false
		}
	}

	/** Polls, then schedules the next poll. Stops once the client is replaced */
	async #poll(client: MoxaClient): Promise<void> {
		this.#pollTimer = undefined
		try {
			const full = !this.#queried
			const counts = this.state.counts
			const messages = full ? fullQuery(counts) : pollQuery(counts, pollData(this.config))
			let answered = true
			for (const message of messages) {
				// Stop at the first unanswered, rather than wait for every request to time out
				answered = await this.#request(client, message)
				if (!answered) break
			}
			if (full && answered && client === this.#client) this.#queried = true
		} finally {
			if (client === this.#client) this.#schedulePoll(client)
		}
	}

	#schedulePoll(client: MoxaClient): void {
		const interval: unknown = this.config.pollInterval
		if (typeof interval !== 'number' || !(interval > 0)) return
		this.#pollTimer = setTimeout(() => void this.#poll(client), interval * 1000)
	}

	#stop(): void {
		clearTimeout(this.#pollTimer)
		this.#pollTimer = undefined
		this.#client?.destroy()
		this.#client = undefined
		this.#queried = false
	}

	/** @returns whether the status changed */
	#status(status: InstanceStatus, message: string | null = null): boolean {
		if (this.#lastStatus?.status === status && this.#lastStatus.message === message) return false
		this.#lastStatus = { status, message }
		this.updateStatus(status, message)
		return true
	}
}
