import type { Appeal } from "@/store/appeals/appeals.types";
import type { HouseMessage } from "@/store/houses/houses.types";

import { apiGet, apiPost } from "./client";

/**
 * Обращения дома
 * @param houseId - id дома
 */
export function fetchHouseAppeals(houseId: number): Promise<Appeal[]> {
	return apiGet<Appeal[]>(`/houses/${houseId}/appeals`);
}

/** Обращение с сообщениями */
export type AppealDetail = Appeal & {
	/** Сообщения чата обращения */
	messages: HouseMessage[];
};

/**
 * Создание обращения
 * @param payload - текст, user_id, house_id
 */
export function createAppeal(payload: {
	text: string;
	user_id: number;
	house_id: number;
	attachments?: string[];
}): Promise<AppealDetail> {
	return apiPost<AppealDetail>("/appeals/create", {
		text: payload.text,
		user_id: payload.user_id,
		house_id: payload.house_id,
		attachments: payload.attachments ?? [],
	});
}

/**
 * Сообщения чата обращения
 * @param appealId - id обращения
 */
export function fetchAppealMessages(appealId: number): Promise<AppealDetail> {
	return apiGet<AppealDetail>(`/appeals/${appealId}/messages`);
}

/**
 * Отправка сообщения в чат обращения
 * @param appealId - id обращения
 * @param payload - текст и user_id
 */
export function sendAppealMessage(
	appealId: number,
	payload: { text: string; user_id: number; attachments?: string[] },
): Promise<HouseMessage> {
	return apiPost<HouseMessage>(`/appeals/${appealId}/message`, {
		text: payload.text,
		user_id: payload.user_id,
		attachments: payload.attachments ?? [],
	});
}
