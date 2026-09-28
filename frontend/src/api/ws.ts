import type { Appeal } from "@/store/appeals/appeals.types";
import type { HouseMessage } from "@/store/houses/houses.types";

import { API_BASE_URL } from "./client";

/** Тип чата для WS */
export type ChatSocketKind = "house" | "appeal";

/** Событие нового сообщения */
export type ChatSocketMessageEvent = {
	type: "message";
	data: HouseMessage;
};

/** Событие прочтения */
export type ChatSocketReadEvent = {
	type: "read";
	message_ids: number[];
};

/** Новая заявка в доме */
export type ChatSocketAppealCreatedEvent = {
	type: "appeal_created";
	data: Appeal;
};

/** Обновление заявки (статус и т.п.) */
export type ChatSocketAppealUpdatedEvent = {
	type: "appeal_updated";
	data: Appeal;
};

export type ChatSocketEvent =
	| ChatSocketMessageEvent
	| ChatSocketReadEvent
	| ChatSocketAppealCreatedEvent
	| ChatSocketAppealUpdatedEvent;

type ChatSocketHandlers = {
	/** Событие с сервера */
	onEvent?: (event: ChatSocketEvent) => void;
	/** Ошибка сокета */
	onError?: (error: Event) => void;
};

const CHAT_SOCKET_EVENT_TYPES = new Set(["message", "read", "appeal_created", "appeal_updated"]);

/**
 * HTTP base → WebSocket base
 * @param apiBase - VITE_API_URL
 */
export function getWsBaseUrl(apiBase = API_BASE_URL): string {
	// Относительный base (`/api`) достраивается от текущего origin
	const url = new URL(apiBase || "/", window.location.href);
	url.protocol = url.protocol === "https:" ? "wss:" : "ws:";

	return url.href.replace(/\/$/, "");
}

/**
 * WebSocket чата дома / заявки
 */
export class ChatSocket {
	private socket: WebSocket | null = null;
	private handlers: ChatSocketHandlers = {};
	private pendingReadIds = new Set<number>();

	/**
	 * Подписка на события
	 * @param handlers - колбэки
	 * @returns {void}
	 */
	setHandlers(handlers: ChatSocketHandlers): void {
		this.handlers = handlers;
	}

	/**
	 * Подключение к каналу чата
	 * @param kind - дом или заявка
	 * @param chatId - id чата
	 * @param userId - id пользователя MAX
	 * @returns {void}
	 */
	connect(kind: ChatSocketKind, chatId: number, userId: number): void {
		this.close();

		const path = kind === "house" ? `/ws/houses/${chatId}` : `/ws/appeals/${chatId}`;
		const url = `${getWsBaseUrl()}${path}?user_id=${userId}`;
		const socket = new WebSocket(url);
		this.socket = socket;

		socket.onopen = () => {
			if (this.socket !== socket) return;
			this.flushPendingReads();
		};

		socket.onmessage = (event) => {
			try {
				const payload = JSON.parse(String(event.data)) as ChatSocketEvent;
				if (payload?.type && CHAT_SOCKET_EVENT_TYPES.has(payload.type)) {
					this.handlers.onEvent?.(payload);
				}
			} catch {
				/* ignore malformed */
			}
		};

		socket.onerror = (error) => {
			this.handlers.onError?.(error);
		};
	}

	/**
	 * Отметить сообщения прочитанными (очередь, пока сокет не OPEN)
	 * @param messageIds - id сообщений
	 * @returns {void}
	 */
	sendRead(messageIds: number[]): void {
		if (!messageIds.length) return;

		for (const id of messageIds) this.pendingReadIds.add(id);
		this.flushPendingReads();
	}

	/**
	 * Закрыть соединение
	 * @returns {void}
	 */
	close(): void {
		if (!this.socket) {
			this.pendingReadIds.clear();
			return;
		}

		this.socket.onopen = null;
		this.socket.onmessage = null;
		this.socket.onerror = null;
		this.socket.close();
		this.socket = null;
		this.pendingReadIds.clear();
	}

	/**
	 * Слить очередь read, если сокет открыт
	 * @returns {void}
	 */
	private flushPendingReads(): void {
		if (!this.pendingReadIds.size || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
			return;
		}

		const messageIds = [...this.pendingReadIds];
		this.pendingReadIds.clear();
		this.socket.send(JSON.stringify({ type: "read", message_ids: messageIds }));
	}
}
