import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
	createAppeal as createAppealRequest,
	fetchHouseAppeals as fetchHouseAppealsRequest,
} from "@/api/appeals";
import { getMaxUserId } from "@/max/webApp";
import { hideLoader, showLoader } from "@/store/ui/ui.slice";

import type { Appeal, AppealsState, CreateAppealArg } from "./appeals.types";

const initialState: AppealsState = {
	items: [],
	status: "idle",
	error: null,
};

/**
 * Загрузка обращений дома
 * @param houseId - id дома
 */
export const fetchHouseAppeals = createAsyncThunk(
	"appeals/fetchHouseAppeals",
	async (houseId: number, { dispatch, rejectWithValue }) => {
		dispatch(showLoader());

		try {
			return await fetchHouseAppealsRequest(houseId);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Не удалось загрузить обращения";
			return rejectWithValue(message);
		} finally {
			dispatch(hideLoader());
		}
	},
);

/**
 * Создание обращения
 * @param payload - дом и текст
 */
export const createAppeal = createAsyncThunk(
	"appeals/createAppeal",
	async (payload: CreateAppealArg, { dispatch, rejectWithValue }) => {
		const userId = getMaxUserId();

		if (userId == null) {
			return rejectWithValue("Не удалось получить id пользователя MAX");
		}

		dispatch(showLoader());

		try {
			return await createAppealRequest({
				text: payload.text,
				user_id: userId,
				house_id: payload.houseId,
				attachments: payload.attachments,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : "Не удалось создать обращение";
			return rejectWithValue(message);
		} finally {
			dispatch(hideLoader());
		}
	},
);

/**
 * AppealDetail → Appeal для списка
 * @param detail - ответ create / messages
 */
function toAppealListItem(detail: Appeal & { messages?: unknown }): Appeal {
	const { messages: _messages, ...appeal } = detail;
	return appeal;
}

/**
 * Вставить / обновить заявку в списке
 * @param items - текущий список
 * @param appeal - заявка
 * @param prepend - новая заявка вверх
 * @returns {void}
 */
function upsertAppeal(items: Appeal[], appeal: Appeal, prepend = false): void {
	const index = items.findIndex((item) => item.id === appeal.id);
	if (index >= 0) {
		items[index] = { ...items[index], ...appeal };
		return;
	}

	if (prepend) items.unshift(appeal);
	else items.push(appeal);
}

const appealsSlice = createSlice({
	name: "appeals",
	initialState,
	reducers: {
		/** Новая заявка из WebSocket */
		appealCreated(state, action: PayloadAction<Appeal>) {
			upsertAppeal(state.items, action.payload, true);
		},
		/** Обновление заявки из WebSocket */
		appealUpdated(state, action: PayloadAction<Appeal>) {
			upsertAppeal(state.items, action.payload);
		},
	},
	extraReducers: (builder) => {
		builder
			/** Старт загрузки обращений */
			.addCase(fetchHouseAppeals.pending, (state) => {
				state.status = "loading";
				state.error = null;
			})
			/** Успешная загрузка обращений */
			.addCase(fetchHouseAppeals.fulfilled, (state, action) => {
				state.status = "succeeded";
				state.items = Array.isArray(action.payload) ? action.payload : [];
				state.error = null;
			})
			/** Ошибка загрузки обращений */
			.addCase(fetchHouseAppeals.rejected, (state, action) => {
				state.status = "failed";
				state.items = [];
				state.error =
					typeof action.payload === "string" ? action.payload : "Не удалось загрузить обращения";
			})
			/** Старт создания обращения */
			.addCase(createAppeal.pending, (state) => {
				state.error = null;
			})
			/** Обращение создано — добавляем в список */
			.addCase(createAppeal.fulfilled, (state, action) => {
				upsertAppeal(state.items, toAppealListItem(action.payload), true);
				state.status = "succeeded";
				state.error = null;
			})
			/** Ошибка создания обращения */
			.addCase(createAppeal.rejected, (state, action) => {
				state.error =
					typeof action.payload === "string" ? action.payload : "Не удалось создать обращение";
			});
	},
});

export const { appealCreated, appealUpdated } = appealsSlice.actions;
export const appealsReducer = appealsSlice.reducer;
