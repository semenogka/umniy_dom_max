import { configureStore } from "@reduxjs/toolkit";

import { appealsReducer } from "./appeals/appeals.slice";
import { housesReducer } from "./houses/houses.slice";
import { uiReducer } from "./ui/ui.slice";

export const store = configureStore({
	reducer: {
		ui: uiReducer,
		houses: housesReducer,
		appeals: appealsReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
