import type { House, HouseDetail, HouseMessage } from "@/store/houses/houses.types";

import { apiGet, apiPost } from "./client";

/**
 * Дома пользователя
 * @param userId - id пользователя MAX
 */
export function fetchUserHouses(userId: number): Promise<House[]> {
	return apiGet<House[]>(`/users/${userId}/houses`);
}

/**
 * Сообщения общего чата дома
 * @param houseId - id дома
 */
export function fetchHouseMessages(houseId: number): Promise<HouseDetail> {
	return apiGet<HouseDetail>(`/houses/${houseId}/messages`);
}

/**
 * Отправка сообщения в общий чат дома
 * @param houseId - id дома
 * @param payload - текст и user_id
 */
export function sendHouseMessage(
	houseId: number,
	payload: { text: string; user_id: number; attachments?: string[] },
): Promise<HouseMessage> {
	return apiPost<HouseMessage>(`/houses/${houseId}/message`, {
		text: payload.text,
		user_id: payload.user_id,
		attachments: payload.attachments ?? [],
	});
}
