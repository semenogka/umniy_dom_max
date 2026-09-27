import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
	fetchHouseMessages as fetchHouseMessagesRequest,
	sendHouseMessage as sendHouseMessageRequest,
} from "@/api/houses";
import { getMaxUserId } from "@/max/webApp";
import { hideLoader, showLoader } from "@/store/ui/ui.slice";

import type { HouseChatState } from "./houseChat.types";

const initialState: HouseChatState = {
	houseId: null,
	messages: [],
	ownSenderName: null,
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
	/** Локальный id для оптимистичного UI */
	clientId: string;
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
	},
	extraReducers: (builder) => {
		builder
			/** Старт загрузки сообщений */
			.addCase(fetchHouseMessages.pending, (state) => {
				state.status = "loading";
				state.error = null;
				state.messages = [];
			})
			/** Успешная загрузка сообщений */
			.addCase(fetchHouseMessages.fulfilled, (state, action) => {
				state.status = "succeeded";
				state.houseId = action.payload.houseId;
				state.messages = action.payload.messages.map((message) => ({
					...message,
					delivery: "sent" as const,
				}));
				state.error = null;
			})
			/** Ошибка загрузки сообщений */
			.addCase(fetchHouseMessages.rejected, (state, action) => {
				state.status = "failed";
				state.houseId = null;
				state.messages = [];
				state.error =
					typeof action.payload === "string" ? action.payload : "Не удалось загрузить сообщения";
			})
			/** Оптимистичное сообщение в pending */
			.addCase(sendHouseMessage.pending, (state, action) => {
				const { clientId, text, senderName } = action.meta.arg;

				state.messages.push({
					id: Date.now(),
					clientId,
					sender: senderName,
					text,
					created_at: new Date().toISOString(),
					attachments: [],
					delivery: "pending",
				});

				if (senderName) state.ownSenderName = senderName;
			})
			/** Бэк сохранил сообщение — обновляем pending */
			.addCase(sendHouseMessage.fulfilled, (state, action) => {
				const { clientId, message } = action.payload;
				const index = state.messages.findIndex((item) => item.clientId === clientId);

				const nextMessage = {
					...message,
					clientId,
					delivery: "sent" as const,
				};

				if (index >= 0) state.messages[index] = nextMessage;
				else state.messages.push(nextMessage);

				state.ownSenderName = message.sender;
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

export const { clearHouseChat } = houseChatSlice.actions;
export const houseChatReducer = houseChatSlice.reducer;
