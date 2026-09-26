import type { House } from "@/store/houses/houses.types";

import { apiGet } from "./client";

/**
 * Дома пользователя
 * @param userId - id пользователя MAX
 */
export function fetchUserHouses(userId: number): Promise<House[]> {
	return apiGet<House[]>(`/users/${userId}/houses`);
}
