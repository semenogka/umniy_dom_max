import { apiPost } from "./client";

/** Тело POST /users/demo */
export type DemoUserIn = {
	user_id: number;
	chat_id: number;
	name: string;
	/** Фото профиля MAX */
	avatar_url?: string | null;
	/** Пароль экрана ЕСИА, нужен только новому жителю */
	password?: string;
};

/** Ответ POST /users/demo */
export type DemoUserOut = {
	id: number;
	name: string;
	chat_id?: number | null;
	avatar_url?: string | null;
};

/**
 * Вход жителя: существующего вернёт, нового зарегистрирует по паролю ЕСИА (иначе 401)
 * @param data - id MAX, chat_id, имя, фото и пароль
 */
export function createDemoUser(data: DemoUserIn): Promise<DemoUserOut> {
	return apiPost<DemoUserOut>("/users/demo", data);
}
