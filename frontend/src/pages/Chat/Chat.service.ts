import { STATUS_META } from "@/components/Status/Status.config";
import type { Appeal } from "@/store/appeals/appeals.types";
import type { House } from "@/store/houses/houses.types";
import { pluralizeRu } from "@/utils/pluralizeRu";

import { CONVERSATION_CHAT_MOCK } from "./Chat.mock";
import type { ChatMock, ChatSidebarAppealItem, ChatSidebarHouse } from "./Chat.types";

/**
 * Собирает className страницы чата
 * @param styles - классы из модуля
 * @param className - дополнительный класс
 */
export function getChatPageClassName(styles: Record<string, string>, className?: string): string {
	return [styles.root, className].filter(Boolean).join(" ");
}

/**
 * Чат жителей для выбранного дома
 * @param houseId - id дома из URL
 */
export function resolveHouseChat(houseId: string): ChatMock {
	return {
		...CONVERSATION_CHAT_MOCK,
		id: houseId,
	};
}

/**
 * Чат обращения: из стора или заглушка
 * @param appealId - id обращения из URL
 * @param appeals - список обращений дома
 */
export function resolveAppealChat(appealId: string, appeals: Appeal[]): ChatMock {
	const appeal = appeals.find((item) => String(item.id) === appealId);

	if (!appeal) {
		return {
			id: appealId,
			type: "appeal",
			headerType: "appeal",
			title: `Обращение №${appealId}`,
			subtitle: "В работе",
			status: "in_progress",
			number: appealId,
			messages: [],
		};
	}

	const title = appeal.problem_type?.trim() || appeal.text.trim() || `Обращение №${appeal.id}`;

	return {
		id: String(appeal.id),
		type: "appeal",
		headerType: "appeal",
		title,
		subtitle: STATUS_META[appeal.status].label,
		status: appeal.status,
		number: String(appeal.id),
		messages: [],
	};
}

/**
 * Данные дома для кнопки в сайдбаре
 * @param house - выбранный дом
 * @param housesCount - всего домов у пользователя
 */
export function getChatSidebarHouse(house: House, housesCount: number): ChatSidebarHouse {
	return {
		address: house.address,
		meta: pluralizeRu(housesCount, ["дом", "дома", "домов"], true),
	};
}

/**
 * Пункт сайдбара из обращения API
 * @param appeal - обращение
 */
export function toChatSidebarAppealItem(appeal: Appeal): ChatSidebarAppealItem {
	const title = appeal.problem_type?.trim() || appeal.text.trim() || `Обращение №${appeal.id}`;

	return {
		id: String(appeal.id),
		title,
		meta: STATUS_META[appeal.status].label,
		status: appeal.status,
	};
}
