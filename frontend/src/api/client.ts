/**
 * Базовый URL API из `VITE_API_URL`
 * @example http://localhost:8000
 */
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/**
 * GET-запрос к API
 * @param path - путь до ресурса API
 */
export async function apiGet<T>(path: string): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${path}`);

	if (!response.ok) {
		let detail = `HTTP ${response.status}`;

		try {
			const body = (await response.json()) as { detail?: unknown };
			if (typeof body.detail === "string") detail = body.detail;
		} catch {
			console.error(response.body);
		}

		throw new Error(detail);
	}

	return response.json() as Promise<T>;
}
