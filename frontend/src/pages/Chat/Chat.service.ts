import { CHAT_MOCKS, DEFAULT_CHAT_ID } from "./Chat.mock";
import type { ChatMock } from "./Chat.types";

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
