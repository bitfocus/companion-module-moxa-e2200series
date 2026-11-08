import axios, { type AxiosInstance } from 'axios'
import PQueue from 'p-queue'
import { errorMessage } from './utils.js'

export const REQUEST_TIMEOUT = 5000

/** The device's CGI over HTTP. One per config: destroy it to drop every request it still holds */
export class MoxaClient {
	readonly #http: AxiosInstance
	// One request at a time, at most one every 100 ms
	readonly #queue = new PQueue({ concurrency: 1, interval: 100, intervalCap: 1 })
	readonly #controller = new AbortController()

	constructor(host: string, timeout = REQUEST_TIMEOUT) {
		this.#http = axios.create({
			baseURL: `http://${host}/`,
			timeout,
			// The device replies in text. Left to infer the type, axios would parse a reply that happened to be JSON
			responseType: 'text',
		})
	}

	/**
	 * Queues a GET
	 * @param signal eg an action's context.signal, so a request no longer wanted is dropped before it is sent
	 * @returns the body of the reply
	 * @throws if the request fails, or is aborted
	 */
	async get(path: string, signal?: AbortSignal): Promise<string> {
		return await this.#queue.add(
			async ({ signal: requestSignal }) => {
				const response = await this.#http.get<unknown>(path, { signal: requestSignal })
				return typeof response.data === 'string' ? response.data : (JSON.stringify(response.data) ?? '')
			},
			{ signal: this.#combineSignal(signal) },
		)
	}

	/** Aborts every request queued or in flight. Each rejects */
	destroy(): void {
		this.#controller.abort()
	}

	/** The request dies whichever fires first: the caller's signal, or this client being destroyed */
	#combineSignal(signal?: AbortSignal): AbortSignal {
		return signal ? AbortSignal.any([this.#controller.signal, signal]) : this.#controller.signal
	}
}

export type RequestFailure =
	/** The device replied, with an error status */
	| { type: 'http'; message: string; detail: string }
	/** No reply: unreachable, refused, or timed out */
	| { type: 'unreachable'; message: string }
	| { type: 'other'; message: string }

export function describeFailure(err: unknown): RequestFailure {
	if (!axios.isAxiosError(err)) return { type: 'other', message: errorMessage(err) }
	if (err.response === undefined) return { type: 'unreachable', message: err.code ?? err.message }
	const data: unknown = err.response.data
	return {
		type: 'http',
		message: `${err.response.status}: ${err.code ?? err.message}`,
		detail: typeof data === 'string' ? data : JSON.stringify(data),
	}
}
