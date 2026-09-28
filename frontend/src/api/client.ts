/**
 * Базовый URL API из `VITE_API_URL`
 * @example http://localhost:8000
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

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

/** Таймаут одной попытки GET: API обычно отвечает быстрее 0.3 с */
const GET_TIMEOUT_MS = 4000;
/** Попыток GET до ошибки */
const GET_ATTEMPTS = 3;

/**
 * GET-запрос к API
 *
 * WebView MAX на iOS иногда не отправляет один из параллельных запросов,
 * и его fetch не завершается никогда: обрываем по таймауту и повторяем.
 * @param path - путь до ресурса API
 */
export async function apiGet<T>(path: string): Promise<T> {
	for (let attempt = 1; ; attempt++) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), GET_TIMEOUT_MS);

		try {
			const response = await fetch(`${API_BASE_URL}${path}`, { signal: controller.signal });

			if (!response.ok) throw new Error(await readErrorDetail(response));

			return (await response.json()) as T;
		} catch (error) {
			const timedOut = error instanceof DOMException && error.name === "AbortError";
			if (!timedOut || attempt >= GET_ATTEMPTS) throw error;
		} finally {
			clearTimeout(timer);
		}
	}
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
