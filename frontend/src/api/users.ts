import { apiPost } from "./client";

/** Тело POST /users/demo */
export type DemoUserIn = {
	user_id: number;
	chat_id: number;
	name: string;
};

/** Ответ POST /users/demo */
export type DemoUserOut = {
	id: number;
	name: string;
	chat_id?: number | null;
};

/**
 * Создать демо-пользователя (идемпотентно)
 * @param data - id MAX, chat_id и имя
 */
export function createDemoUser(data: DemoUserIn): Promise<DemoUserOut> {
	return apiPost<DemoUserOut>("/users/demo", data);
}
