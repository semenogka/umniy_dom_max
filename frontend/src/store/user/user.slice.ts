import { createSlice } from "@reduxjs/toolkit";

import { getMaxUserId, getMaxUserName } from "@/max/webApp";

import type { User } from "./user.types";

type UserState = {
	/** Профиль текущего пользователя из MAX WebApp */
	current?: User;
};

const initialState: UserState = {
	current: undefined,
};

const userSlice = createSlice({
	name: "user",
	initialState,
	reducers: {
		/** Берём id и имя из MAX WebApp */
		initCurrentUser(state) {
			const id = getMaxUserId();
			const name = getMaxUserName();

			if (id == null || !name) {
				state.current = undefined;
				return;
			}

			state.current = { id, name };
		},
	},
});

export const { initCurrentUser } = userSlice.actions;
export const userReducer = userSlice.reducer;
