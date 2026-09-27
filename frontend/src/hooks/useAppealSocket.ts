import { useEffect, useRef } from "react";

import { ChatSocket } from "@/api/ws";
import { appealUpdated } from "@/store/appeals/appeals.slice";
import { appealMessageReceived, appealMessagesRead } from "@/store/appealChat/appealChat.slice";
import { useAppDispatch } from "@/store/hooks";

type UseAppealSocketArgs = {
	/** Id заявки */
	appealId: number | null;
	/** Id пользователя MAX */
	userId: number | null;
};

/**
 * WebSocket чата заявки
 * @param args - заявка и пользователь
 * @returns sendRead
 */
export function useAppealSocket(args: UseAppealSocketArgs) {
	const { appealId, userId } = args;
	const dispatch = useAppDispatch();
	const socketRef = useRef<ChatSocket | null>(null);

	useEffect(() => {
		if (appealId == null || userId == null) return;

		const socket = new ChatSocket();
		socketRef.current = socket;

		socket.setHandlers({
			onEvent: (event) => {
				if (event.type === "message") {
					dispatch(appealMessageReceived(event.data));
					return;
				}

				if (event.type === "read") {
					dispatch(appealMessagesRead(event.message_ids));
					return;
				}

				if (event.type === "appeal_updated") {
					dispatch(appealUpdated(event.data));
				}
			},
		});

		socket.connect("appeal", appealId, userId);

		return () => {
			socket.close();
			if (socketRef.current === socket) socketRef.current = null;
		};
	}, [appealId, dispatch, userId]);

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
