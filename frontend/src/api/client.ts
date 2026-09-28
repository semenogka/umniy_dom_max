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
 * WebView MAX на iOS иногда не отправляет запрос, и его fetch не завершается
 * никогда, причём на abort() тоже не реагирует. Поэтому таймаут — через
 * собственный таймер в Promise.race, а не только через AbortController.
 * @param path - путь до ресурса API
 */
export async function apiGet<T>(path: string): Promise<T> {
	for (let attempt = 1; ; attempt++) {
		const controller = new AbortController();
		let timer: ReturnType<typeof setTimeout> | undefined;
		const timeout = new Promise<never>((_, reject) => {
			timer = setTimeout(() => {
				controller.abort();
				reject(new RequestTimeoutError());
			}, GET_TIMEOUT_MS);
		});

		try {
			return await Promise.race([getJson<T>(path, controller.signal), timeout]);
		} catch (error) {
			if (!(error instanceof RequestTimeoutError) || attempt >= GET_ATTEMPTS) throw error;
		} finally {
			clearTimeout(timer);
		}
	}
}

class RequestTimeoutError extends Error {
	constructor() {
		super("Сервер не ответил, попробуйте ещё раз");
	}
}

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${path}`, { signal });

	if (!response.ok) throw new Error(await readErrorDetail(response));

	return (await response.json()) as T;
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

/**
 * PATCH-запрос к API
 * @param path - путь до ресурса API
 * @param body - тело запроса
 */
export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!response.ok) throw new Error(await readErrorDetail(response));

	return response.json() as Promise<T>;
}
