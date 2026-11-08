/** The message of anything thrown, which need not be an Error */
export function errorMessage(err: unknown): string {
	return err instanceof Error ? err.message : String(err)
}
