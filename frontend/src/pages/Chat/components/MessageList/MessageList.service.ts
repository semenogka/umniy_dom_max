import type { ChatMessage } from "../../Chat.types";

import {
	MESSAGE_LIST_DATE_STICKY_TOP,
	MESSAGE_LIST_STICK_BOTTOM_THRESHOLD,
} from "./MessageList.config";
import type { MessageListDateGroup, MessageListSenderGroup } from "./MessageList.types";

/**
 * Ключ отправителя для группировки
 * @param message - сообщение
 */
export function getMessageSenderKey(message: ChatMessage): string {
	if (message.kind === "out") return "out";

	return ["in", message.author ?? "", message.avatarUrl ?? ""].join(":");
}

/**
 * ClassName группы отправителя
 * @param styles - классы из модуля
 * @param isOut - исходящие
 */
export function getMessageListSenderGroupClassName(
	styles: Record<string, string>,
	isOut: boolean,
): string {
	return [styles.senderGroup, isOut ? styles.senderGroupOut : styles.senderGroupIn].join(" ");
}

/**
 * Лента у низа или почти у низа
 * @param element - контейнер ленты
 * @param threshold - допуск в px
 */
export function isMessageListNearBottom(
	element: HTMLElement,
	threshold = MESSAGE_LIST_STICK_BOTTOM_THRESHOLD,
): boolean {
	const distance = element.scrollHeight - element.scrollTop - element.clientHeight;

	return distance <= threshold;
}

/**
 * Прокручивает ленту вниз
 * @param element - контейнер ленты
 */
export function scrollMessageListToBottom(element: HTMLElement) {
	element.scrollTop = element.scrollHeight;
}

/**
 * DateChip в состоянии sticky
 * @param list - контейнер ленты
 * @param sentinel - якорь над DateChip
 * @param stickyTop - top sticky
 */
export function isMessageListDateStuck(
	list: HTMLElement,
	sentinel: HTMLElement,
	stickyTop = MESSAGE_LIST_DATE_STICKY_TOP,
): boolean {
	const listTop = list.getBoundingClientRect().top;
	const sentinelTop = sentinel.getBoundingClientRect().top;

	return sentinelTop < listTop + stickyTop;
}

/**
 * Синхронизирует data-stuck на sticky-датах
 * @param list - контейнер ленты
 * @param sentinels - sentinel по label
 * @param chips - sticky-обёртки DateChip по label
 */
export function syncMessageListDateStuck(
	list: HTMLElement,
	sentinels: Map<string, HTMLElement>,
	chips: Map<string, HTMLElement>,
) {
	for (const [label, sentinel] of sentinels) {
		const chip = chips.get(label);
		if (!chip) continue;

		if (isMessageListDateStuck(list, sentinel)) {
			chip.dataset.stuck = "";
		} else {
			delete chip.dataset.stuck;
		}
	}
}

/**
 * Группирует сообщения по дате
 * @param messages - сообщения
 */
export function groupMessagesByDate(messages: ChatMessage[]): MessageListDateGroup[] {
	const groups: MessageListDateGroup[] = [];

	for (const message of messages) {
		const last = groups.at(-1);

		if (last && last.dateLabel === message.dateLabel) {
			last.messages.push(message);
			continue;
		}

		groups.push({ dateLabel: message.dateLabel, messages: [message] });
	}

	return groups;
}

/**
 * Группирует подряд сообщения одного отправителя
 * @param messages - сообщения одного дня
 */
export function groupMessagesBySender(messages: ChatMessage[]): MessageListSenderGroup[] {
	const groups: MessageListSenderGroup[] = [];

	for (const message of messages) {
		const key = getMessageSenderKey(message);
		const last = groups.at(-1);

		if (last && last.key === key) {
			last.messages.push(message);
			continue;
		}

		groups.push({
			key,
			isOut: message.kind === "out",
			avatarUrl: message.avatarUrl,
			messages: [message],
		});
	}

	return groups;
}
