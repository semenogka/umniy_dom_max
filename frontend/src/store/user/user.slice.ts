import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { ApiError } from "@/api/client";
import { createDemoUser } from "@/api/users";
import { getMaxChatId, getMaxUserId, getMaxUserName, getMaxUserPhoto } from "@/max/webApp";
import { hideLoader, showLoader } from "@/store/ui/ui.slice";

import type { User } from "./user.types";

type UserState = {
	/** Профиль текущего пользователя из MAX WebApp */
	current?: User;
	/** Статус входа /users/demo */
	demoStatus: "idle" | "loading" | "succeeded" | "failed";
	/** Житель не зарегистрирован — показываем экран ЕСИА */
	authRequired: boolean;
	/** Ошибка /users/demo */
	demoError: string | null;
};

const initialState: UserState = {
	current: undefined,
	demoStatus: "idle",
	authRequired: false,
	demoError: null,
};

/** Ответ 401: житель не зарегистрирован, а пароль не передан или неверный */
const UNAUTHORIZED = "unauthorized";

/**
 * POST /users/demo — войти; новый житель регистрируется только с паролем ЕСИА
 * @param password - пароль с экрана ЕСИА, без него только вход существующего
 */
export const ensureDemoUser = createAsyncThunk(
	"user/ensureDemoUser",
	async (password: string | undefined, { dispatch, rejectWithValue }) => {
		const userId = getMaxUserId();

		if (userId == null) {
			return rejectWithValue("Не удалось получить id пользователя MAX");
		}

		// Первичная проверка под Loader, вход по паролю — на кнопке экрана ЕСИА
		if (!password) dispatch(showLoader());

		try {
			return await createDemoUser({
				user_id: userId,
				chat_id: getMaxChatId() ?? userId,
				name: getMaxUserName() || "Житель",
				avatar_url: getMaxUserPhoto(),
				password,
			});
		} catch (error) {
			if (error instanceof ApiError && error.status === 401) return rejectWithValue(UNAUTHORIZED);

			const message =
				error instanceof Error ? error.message : "Не удалось зарегистрировать пользователя";
			return rejectWithValue(message);
		} finally {
			if (!password) dispatch(hideLoader());
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

			state.current = {
				id,
				name: getMaxUserName() ?? "",
				avatarUrl: getMaxUserPhoto() ?? undefined,
			};
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
				state.authRequired = false;
				state.demoError = null;
				state.current = {
					id: action.payload.id,
					name: action.payload.name || state.current?.name || "",
					avatarUrl: action.payload.avatar_url || state.current?.avatarUrl,
				};
			})
			/** Ошибка /users/demo */
			.addCase(ensureDemoUser.rejected, (state, action) => {
				if (action.payload === UNAUTHORIZED) {
					state.demoStatus = "failed";
					state.authRequired = true;
					// Первый вход без пароля — просто показать экран, ошибка только на неверный пароль
					state.demoError = action.meta.arg ? "Неверный пароль" : null;
					return;
				}

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
