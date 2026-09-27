/**
 * Базовый URL API из `VITE_API_URL`
 * @example http://localhost:8000
 */
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/**
 * Разбор ошибки ответа API
 * @param response - ответ fetch
 */
async function readErrorDetail(response: Response): Promise<string> {
	let detail = `HTTP ${response.status}`;

	try {
		const body = (await response.json()) as { detail?: unknown };
		if (typeof body.detail === "string") detail = body.detail;
	} catch {
		console.error(response.body);
	}

	return detail;
}

/**
 * GET-запрос к API
 * @param path - путь до ресурса API
 */
export async function apiGet<T>(path: string): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${path}`);

	if (!response.ok) throw new Error(await readErrorDetail(response));

	return response.json() as Promise<T>;
}

/**
 * POST-запрос к API
 * @param path - путь до ресурса API
 * @param body - тело запроса
 */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!response.ok) throw new Error(await readErrorDetail(response));

	return response.json() as Promise<T>;
}
