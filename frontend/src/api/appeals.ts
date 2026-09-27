import type { Appeal } from "@/store/appeals/appeals.types";

import { apiGet } from "./client";

/**
 * Обращения дома
 * @param houseId - id дома
 */
export function fetchHouseAppeals(houseId: number): Promise<Appeal[]> {
	return apiGet<Appeal[]>(`/appeals/${houseId}`);
}
