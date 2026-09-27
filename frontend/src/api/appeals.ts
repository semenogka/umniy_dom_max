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
