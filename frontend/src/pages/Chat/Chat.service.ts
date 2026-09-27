import { STATUS_META } from "@/components/Status/Status.config";
import type { Appeal } from "@/store/appeals/appeals.types";
import type { House } from "@/store/houses/houses.types";
import { pluralizeRu } from "@/utils/pluralizeRu";

import { CHAT_MOCKS, DEFAULT_CHAT_ID } from "./Chat.mock";
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
 * Возвращает мок чата по id
 * @param chatId - id из URL
 */
export function resolveChat(chatId?: string): ChatMock {
	if (chatId && CHAT_MOCKS[chatId]) return CHAT_MOCKS[chatId];

	return CHAT_MOCKS[DEFAULT_CHAT_ID];
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
