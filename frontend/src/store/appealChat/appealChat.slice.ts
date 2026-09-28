import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
	fetchAppealMessages as fetchAppealMessagesRequest,
	sendAppealMessage as sendAppealMessageRequest,
} from "@/api/appeals";
import { getMaxUserId } from "@/max/webApp";
import { upsertServerMessage, withDelivery } from "@/store/chatMessage";
import type { HouseMessage } from "@/store/houses/houses.types";

import type { AppealChatState } from "./appealChat.types";

const initialState: AppealChatState = {
	appealId: null,
	loadingAppealId: null,
	messages: [],
	status: "idle",
	error: null,
};

/**
 * Загрузка сообщений чата обращения
 * @param appealId - id обращения
 */
export const fetchAppealMessages = createAsyncThunk(
	"appealChat/fetchAppealMessages",
	async (appealId: number, { rejectWithValue }) => {
		try {
			const appeal = await fetchAppealMessagesRequest(appealId);
			return {
				appealId,
				messages: Array.isArray(appeal.messages) ? appeal.messages : [],
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : "Не удалось загрузить сообщения";
			return rejectWithValue(message);
		}
	},
);

type SendAppealMessageArg = {
	/** Id обращения */
	appealId: number;
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
 * Отправка сообщения в чат обращения
 * @param payload - обращение, текст и clientId
 */
export const sendAppealMessage = createAsyncThunk(
	"appealChat/sendAppealMessage",
	async (payload: SendAppealMessageArg, { rejectWithValue }) => {
		const userId = getMaxUserId();

		if (userId == null) {
			return rejectWithValue("Не удалось получить id пользователя MAX");
		}

		try {
			const message = await sendAppealMessageRequest(payload.appealId, {
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

const appealChatSlice = createSlice({
	name: "appealChat",
	initialState,
	reducers: {
		/** Очистка чата обращения */
		clearAppealChat() {
			return initialState;
		},
		/** Сообщение из WebSocket */
		appealMessageReceived(state, action: PayloadAction<HouseMessage>) {
			upsertServerMessage(state.messages, action.payload);
		},
		/** Прочтение из WebSocket */
		appealMessagesRead(state, action: PayloadAction<number[]>) {
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
			.addCase(fetchAppealMessages.pending, (state, action) => {
				state.status = "loading";
				state.error = null;
				state.appealId = null;
				state.loadingAppealId = action.meta.arg;
				state.messages = [];
			})
			/** Успешная загрузка сообщений */
			.addCase(fetchAppealMessages.fulfilled, (state, action) => {
				if (action.meta.arg !== state.loadingAppealId) return;

				state.status = "succeeded";
				state.appealId = action.payload.appealId;
				state.loadingAppealId = null;
				state.messages = action.payload.messages.map(withDelivery);
				state.error = null;
			})
			/** Ошибка загрузки сообщений */
			.addCase(fetchAppealMessages.rejected, (state, action) => {
				if (action.meta.arg !== state.loadingAppealId) return;

				state.status = "failed";
				state.appealId = null;
				state.loadingAppealId = null;
				state.messages = [];
				state.error =
					typeof action.payload === "string" ? action.payload : "Не удалось загрузить сообщения";
			})
			/** Оптимистичное сообщение в pending */
			.addCase(sendAppealMessage.pending, (state, action) => {
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
			.addCase(sendAppealMessage.fulfilled, (state, action) => {
				const { clientId, message } = action.payload;
				upsertServerMessage(state.messages, message, clientId);
			})
			/** Ошибка отправки — помечаем pending */
			.addCase(sendAppealMessage.rejected, (state, action) => {
				const clientId = action.meta.arg.clientId;
				const message = state.messages.find((item) => item.clientId === clientId);

				if (message) message.delivery = "error";

				state.error =
					typeof action.payload === "string" ? action.payload : "Не удалось отправить сообщение";
			});
	},
});

export const { clearAppealChat, appealMessageReceived, appealMessagesRead } =
	appealChatSlice.actions;
export const appealChatReducer = appealChatSlice.reducer;
