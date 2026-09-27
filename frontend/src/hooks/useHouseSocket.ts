import { useEffect, useRef } from "react";

import { ChatSocket } from "@/api/ws";
import { appealCreated, appealUpdated } from "@/store/appeals/appeals.slice";
import { houseMessageReceived, houseMessagesRead } from "@/store/houseChat/houseChat.slice";
import { useAppDispatch } from "@/store/hooks";

type UseHouseSocketArgs = {
	/** Id дома */
	houseId: number | null;
	/** Id пользователя MAX */
	userId: number | null;
	/** Слушать сообщения / read общего чата дома */
	listenChat: boolean;
};

/**
 * WS дома: заявки всегда, сообщения чата — если listenChat
 * @param args - дом и пользователь
 * @returns sendRead для общего чата (no-op если !listenChat)
 */
export function useHouseSocket(args: UseHouseSocketArgs) {
	const { houseId, userId, listenChat } = args;
	const dispatch = useAppDispatch();
	const socketRef = useRef<ChatSocket | null>(null);
	const listenChatRef = useRef(listenChat);
	listenChatRef.current = listenChat;

	useEffect(() => {
		if (houseId == null || userId == null) return;

		const socket = new ChatSocket();
		socketRef.current = socket;

		socket.setHandlers({
			onEvent: (event) => {
				if (event.type === "appeal_created") {
					dispatch(appealCreated(event.data));
					return;
				}

				if (event.type === "appeal_updated") {
					dispatch(appealUpdated(event.data));
					return;
				}

				if (!listenChatRef.current) return;

				if (event.type === "message") {
					dispatch(houseMessageReceived(event.data));
					return;
				}

				if (event.type === "read") {
					dispatch(houseMessagesRead(event.message_ids));
				}
			},
		});

		socket.connect("house", houseId, userId);

		return () => {
			socket.close();
			if (socketRef.current === socket) socketRef.current = null;
		};
	}, [dispatch, houseId, userId]);

	/**
	 * Отправить read по видимым сообщениям дома
	 * @param messageIds - id сообщений
	 * @returns {void}
	 */
	const sendRead = (messageIds: number[]) => {
		if (!listenChatRef.current) return;
		socketRef.current?.sendRead(messageIds);
	};

	return { sendRead };
}
