import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { createDemoUser } from "@/api/users";
import { getMaxChatId, getMaxUserId, getMaxUserName } from "@/max/webApp";

import type { User } from "./user.types";

type UserState = {
	/** Профиль текущего пользователя из MAX WebApp */
	current?: User;
	/** Статус регистрации /users/demo */
	demoStatus: "idle" | "loading" | "succeeded" | "failed";
	/** Ошибка /users/demo */
	demoError: string | null;
};

const initialState: UserState = {
	current: undefined,
	demoStatus: "idle",
	demoError: null,
};

/**
 * POST /users/demo — создать пользователя в БД, если ещё нет
 */
export const ensureDemoUser = createAsyncThunk(
	"user/ensureDemoUser",
	async (_, { rejectWithValue }) => {
		const userId = getMaxUserId();

		if (userId == null) {
			return rejectWithValue("Не удалось получить id пользователя MAX");
		}

		const chatId = getMaxChatId() ?? userId;
		const name = getMaxUserName() || "Житель";

		try {
			return await createDemoUser({
				user_id: userId,
				chat_id: chatId,
				name,
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Не удалось зарегистрировать пользователя";
			return rejectWithValue(message);
		}
	},
);

const userSlice = createSlice({
	name: "user",
	initialState,
	reducers: {
		/** Берём id и имя из MAX WebApp */
		initCurrentUser(state) {
			const id = getMaxUserId();

			if (id == null) {
				state.current = undefined;
				return;
			}

			state.current = { id, name: getMaxUserName() ?? "" };
		},
	},
	extraReducers: (builder) => {
		builder
			/** Старт /users/demo */
			.addCase(ensureDemoUser.pending, (state) => {
				state.demoStatus = "loading";
				state.demoError = null;
			})
			/** Пользователь есть в БД */
			.addCase(ensureDemoUser.fulfilled, (state, action) => {
				state.demoStatus = "succeeded";
				state.demoError = null;
				state.current = {
					id: action.payload.id,
					name: action.payload.name || state.current?.name || "",
				};
			})
			/** Ошибка /users/demo */
			.addCase(ensureDemoUser.rejected, (state, action) => {
				state.demoStatus = "failed";
				state.demoError =
					typeof action.payload === "string"
						? action.payload
						: "Не удалось зарегистрировать пользователя";
			});
	},
});

export const { initCurrentUser } = userSlice.actions;
export const userReducer = userSlice.reducer;
