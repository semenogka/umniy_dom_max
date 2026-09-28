import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = {
	/** Глобальный Loader */
	isLoading: boolean;
	/** Число активных загрузок */
	loadingCount: number;
};

const initialState: UiState = {
	isLoading: false,
	loadingCount: 0,
};

const uiSlice = createSlice({
	name: "ui",
	initialState,
	reducers: {
		showLoader(state) {
			state.loadingCount += 1;
			state.isLoading = true;
		},
		hideLoader(state) {
			state.loadingCount = Math.max(0, state.loadingCount - 1);
			state.isLoading = state.loadingCount > 0;
		},
		/** Принудительный сброс (watchdog / зависший show без hide) */
		resetLoader(state) {
			state.loadingCount = 0;
			state.isLoading = false;
		},
		setLoading(state, action: PayloadAction<boolean>) {
			if (action.payload) {
				state.loadingCount += 1;
				state.isLoading = true;
				return;
			}

			state.loadingCount = Math.max(0, state.loadingCount - 1);
			state.isLoading = state.loadingCount > 0;
		},
	},
});

export const { showLoader, hideLoader, resetLoader, setLoading } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
