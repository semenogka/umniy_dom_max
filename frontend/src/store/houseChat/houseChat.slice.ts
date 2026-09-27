import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
	fetchHouseMessages as fetchHouseMessagesRequest,
	sendHouseMessage as sendHouseMessageRequest,
} from "@/api/houses";
import { getMaxUserId } from "@/max/webApp";
import { upsertServerMessage, withDelivery } from "@/store/chatMessage";
import type { HouseMessage } from "@/store/houses/houses.types";
import { hideLoader, showLoader } from "@/store/ui/ui.slice";

import type { HouseChatState } from "./houseChat.types";

const initialState: HouseChatState = {
	houseId: null,
	loadingHouseId: null,
	messages: [],
	status: "idle",
	error: null,
};

/**
 * Загрузка сообщений общего чата дома
 * @param houseId - id дома
 */
export const fetchHouseMessages = createAsyncThunk(
	"houseChat/fetchHouseMessages",
	async (houseId: number, { dispatch, rejectWithValue }) => {
		dispatch(showLoader());

		try {
			const house = await fetchHouseMessagesRequest(houseId);
			return { houseId, messages: Array.isArray(house.messages) ? house.messages : [] };
		} catch (error) {
			const message = error instanceof Error ? error.message : "Не удалось загрузить сообщения";
			return rejectWithValue(message);
		} finally {
			dispatch(hideLoader());
		}
	},
);

type SendHouseMessageArg = {
	/** Id дома */
	houseId: number;
	/** Текст сообщения */
	text: string;
	/** Вложения (base64 / data URL) */
	attachments?: string[];
	/** Метаданные вложений для optimistic UI */
	attachmentMeta?: Array<{ dataUrl: string; name: string; mime: string }>;
	/** Локальный id для оптимистичного UI */
	clientId: string;
	/** Id отправителя (MAX) */
	senderId: number;
	/** Имя отправителя для pending-бабла */
	senderName: string;
};

/**
 * Отправка сообщения в общий чат дома
 * @param payload - дом, текст и clientId
 */
export const sendHouseMessage = createAsyncThunk(
	"houseChat/sendHouseMessage",
	async (payload: SendHouseMessageArg, { rejectWithValue }) => {
		const userId = getMaxUserId();

		if (userId == null) {
			return rejectWithValue("Не удалось получить id пользователя MAX");
		}

		try {
			const message = await sendHouseMessageRequest(payload.houseId, {
				text: payload.text,
				user_id: userId,
				attachments: payload.attachments,
			});

			return { clientId: payload.clientId, message };
		} catch (error) {
			const message = error instanceof Error ? error.message : "Не удалось отправить сообщение";
			return rejectWithValue(message);
		}
	},
);

const houseChatSlice = createSlice({
	name: "houseChat",
	initialState,
	reducers: {
		/** Очистка чата дома */
		clearHouseChat() {
			return initialState;
		},
		/** Сообщение из WebSocket */
		houseMessageReceived(state, action: PayloadAction<HouseMessage>) {
			upsertServerMessage(state.messages, action.payload);
		},
		/** Прочтение из WebSocket */
		houseMessagesRead(state, action: PayloadAction<number[]>) {
			const ids = new Set(action.payload);

			for (const message of state.messages) {
				if (!ids.has(message.id)) continue;
				message.is_read = true;
				if (message.delivery && message.delivery !== "error" && message.delivery !== "pending") {
					message.delivery = "read";
				}
			}
		},
	},
	extraReducers: (builder) => {
		builder
			/** Старт загрузки сообщений */
			.addCase(fetchHouseMessages.pending, (state, action) => {
				state.status = "loading";
				state.error = null;
				state.houseId = null;
				state.loadingHouseId = action.meta.arg;
				state.messages = [];
			})
			/** Успешная загрузка сообщений */
			.addCase(fetchHouseMessages.fulfilled, (state, action) => {
				if (action.meta.arg !== state.loadingHouseId) return;

				state.status = "succeeded";
				state.houseId = action.payload.houseId;
				state.loadingHouseId = null;
				state.messages = action.payload.messages.map(withDelivery);
				state.error = null;
			})
			/** Ошибка загрузки сообщений */
			.addCase(fetchHouseMessages.rejected, (state, action) => {
				if (action.meta.arg !== state.loadingHouseId) return;

				state.status = "failed";
				state.houseId = null;
				state.loadingHouseId = null;
				state.messages = [];
				state.error =
					typeof action.payload === "string" ? action.payload : "Не удалось загрузить сообщения";
			})
			/** Оптимистичное сообщение в pending */
			.addCase(sendHouseMessage.pending, (state, action) => {
				const {
					clientId,
					text,
					senderId,
					senderName,
					attachments = [],
					attachmentMeta,
				} = action.meta.arg;

				state.messages.push({
					id: Date.now(),
					clientId,
					sender_id: senderId,
					sender: senderName,
					text,
					created_at: new Date().toISOString(),
					is_read: false,
					attachments: attachments.map((url, index) => ({
						id: index,
						url,
						ord: index,
						name: attachmentMeta?.[index]?.name,
					})),
					delivery: "pending",
				});
			})
			/** Бэк сохранил сообщение — обновляем pending */
			.addCase(sendHouseMessage.fulfilled, (state, action) => {
				const { clientId, message } = action.payload;
				upsertServerMessage(state.messages, message, clientId);
			})
			/** Ошибка отправки — помечаем pending */
			.addCase(sendHouseMessage.rejected, (state, action) => {
				const clientId = action.meta.arg.clientId;
				const message = state.messages.find((item) => item.clientId === clientId);

				if (message) message.delivery = "error";

				state.error =
					typeof action.payload === "string" ? action.payload : "Не удалось отправить сообщение";
			});
	},
});

export const { clearHouseChat, houseMessageReceived, houseMessagesRead } = houseChatSlice.actions;
export const houseChatReducer = houseChatSlice.reducer;
