import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

/**
 * A stand-in for an ioLogik's CGI, holding parameters by key.
 *
 * Synthetic: there is no capture of a real device. The keys and requests follow appendix G of the E2200 manual (v1.0),
 * but it doesn't show a reply. A reply here is `KEY=value<br>` for each key asked for, which is the shape the module's
 * parser has always taken apart. What a real device sends back for setParam.cgi isn't known either, so this replies with
 * an empty body and lets a later get report the change.
 */
export class FakeMoxa {
	readonly params = new Map<string, string>()
	/** The path and query of every request, in order */
	readonly requests: string[] = []
	/** Drop the connection rather than reply, as an unreachable device would look */
	unreachable = false
	/** Reply with this status rather than 200 */
	status = 200
	#hold: Promise<void> | undefined
	#release: (() => void) | undefined
	readonly #server: Server

	constructor() {
		this.#server = createServer((req, res) => void this.#handle(req, res))
	}

	get port(): number {
		return (this.#server.address() as AddressInfo).port
	}

	/** The requests to a CGI, with the path left off */
	queries(cgi: 'getParam.cgi' | 'setParam.cgi'): string[] {
		return this.requests.filter((r) => r.startsWith(`/${cgi}?`)).map((r) => r.slice(cgi.length + 2))
	}

	/** Holds every request from now until released, so a test can act while one is in flight */
	hold(): void {
		this.#hold = new Promise((resolve) => (this.#release = resolve))
	}

	release(): void {
		this.#release?.()
		this.#hold = undefined
	}

	async listen(): Promise<void> {
		await new Promise<void>((resolve) => this.#server.listen(0, '127.0.0.1', resolve))
	}

	async close(): Promise<void> {
		this.release()
		this.#server.closeAllConnections()
		await new Promise<void>((resolve) => this.#server.close(() => resolve()))
	}

	async #handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		const url = req.url ?? ''
		this.requests.push(url)
		if (this.#hold) await this.#hold
		if (this.unreachable) {
			req.socket.destroy()
			return
		}
		if (this.status !== 200) {
			res.writeHead(this.status, { 'Content-Type': 'text/html' }).end('Bad request')
			return
		}
		const [path, query = ''] = url.split(/\?(.*)/s)
		const pairs = query.split('&').map((pair) => {
			const eq = pair.indexOf('=')
			return [pair.slice(0, eq), pair.slice(eq + 1)] as const
		})
		if (path === '/getParam.cgi') {
			const body = pairs.map(([key]) => `${key}=${this.params.get(key) ?? '0'}<br>`).join('')
			res.writeHead(200, { 'Content-Type': 'text/html' }).end(body)
		} else if (path === '/setParam.cgi') {
			for (const [key, value] of pairs) this.params.set(key, value)
			res.writeHead(200, { 'Content-Type': 'text/html' }).end('')
		} else {
			res.writeHead(404).end()
		}
	}
}

/** Device information as a configured unit might report it */
export const DEVICE_INFO = {
	DATE: '2026/11/08',
	TIME: '16:45:00',
	LOC: 'Rack 3',
	DESC: 'Stage GPIO',
	FWR_V: 'V1.13',
	MOD_NAME: 'E2210',
	SN_NUM: 'TAHFB1234567',
	MAC_ADDR: '00:90:E8:12:34:56',
	IP: '192.168.127.254',
} as const
