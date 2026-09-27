import { configureStore } from "@reduxjs/toolkit";

import { appealChatReducer } from "./appealChat/appealChat.slice";
import { appealsReducer } from "./appeals/appeals.slice";
import { houseChatReducer } from "./houseChat/houseChat.slice";
import { housesReducer } from "./houses/houses.slice";
import { uiReducer } from "./ui/ui.slice";
import { userReducer } from "./user/user.slice";

export const store = configureStore({
	reducer: {
		ui: uiReducer,
		user: userReducer,
		houses: housesReducer,
		appeals: appealsReducer,
		houseChat: houseChatReducer,
		appealChat: appealChatReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
