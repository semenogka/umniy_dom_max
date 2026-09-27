import { useEffect, useRef } from "react";

import { ChatSocket, type ChatSocketKind } from "@/api/ws";
import { appealMessageReceived, appealMessagesRead } from "@/store/appealChat/appealChat.slice";
import { houseMessageReceived, houseMessagesRead } from "@/store/houseChat/houseChat.slice";
import { useAppDispatch } from "@/store/hooks";

type UseChatSocketArgs = {
	/** Тип чата */
	kind: ChatSocketKind | null;
	/** Id дома или заявки */
	chatId: number | null;
	/** Id пользователя MAX */
	userId: number | null;
};

/**
 * WebSocket текущего чата: при смене kind/chatId переподключаемся
 * @param args - канал и пользователь
 * @returns sendRead
 */
export function useChatSocket(args: UseChatSocketArgs) {
	const { kind, chatId, userId } = args;
	const dispatch = useAppDispatch();
	const socketRef = useRef<ChatSocket | null>(null);

	useEffect(() => {
		if (kind == null || chatId == null || userId == null) return;

		const socket = new ChatSocket();
		socketRef.current = socket;

		socket.setHandlers({
			onEvent: (event) => {
				if (event.type === "message") {
					if (kind === "house") dispatch(houseMessageReceived(event.data));
					else dispatch(appealMessageReceived(event.data));
					return;
				}

				if (event.type === "read") {
					if (kind === "house") dispatch(houseMessagesRead(event.message_ids));
					else dispatch(appealMessagesRead(event.message_ids));
				}
			},
		});

		socket.connect(kind, chatId, userId);

		return () => {
			socket.close();
			if (socketRef.current === socket) socketRef.current = null;
		};
	}, [chatId, dispatch, kind, userId]);

	/**
	 * Отправить read по видимым сообщениям
	 * @param messageIds - id сообщений
	 * @returns {void}
	 */
	const sendRead = (messageIds: number[]) => {
		socketRef.current?.sendRead(messageIds);
	};

	return { sendRead };
}
