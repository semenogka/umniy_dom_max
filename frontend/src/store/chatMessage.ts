import type { HouseMessage } from "@/store/houses/houses.types";

/**
 * Delivery из is_read с бэка
 * @param message - сообщение API
 */
export function withDelivery(message: HouseMessage): HouseMessage {
	return {
		...message,
		delivery: message.is_read ? "read" : "sent",
	};
}

/**
 * WS / HTTP: вставить или слить с pending (гонка сокета)
 * @param messages - лента стора
 * @param incoming - сообщение с сервера
 * @param clientId - локальный id, если есть
 * @returns {void}
 */
export function upsertServerMessage(
	messages: HouseMessage[],
	incoming: HouseMessage,
	clientId?: string,
): void {
	const next = { ...withDelivery(incoming), ...(clientId ? { clientId } : {}) };

	const byId = messages.findIndex((item) => item.id === next.id);
	if (byId >= 0) {
		const existingClientId = messages[byId].clientId;
		messages[byId] = { ...next, clientId: clientId ?? existingClientId };
		return;
	}

	const byClient = clientId != null ? messages.findIndex((item) => item.clientId === clientId) : -1;
	if (byClient >= 0) {
		messages[byClient] = next;
		return;
	}

	/** WS раньше HTTP: pending ещё с временным id */
	const pendingIndex = messages.findIndex(
		(item) =>
			item.delivery === "pending" && item.sender_id === next.sender_id && item.text === next.text,
	);
	if (pendingIndex >= 0) {
		messages[pendingIndex] = {
			...next,
			clientId: messages[pendingIndex].clientId ?? clientId,
		};
		return;
	}

	messages.push(next);
}
