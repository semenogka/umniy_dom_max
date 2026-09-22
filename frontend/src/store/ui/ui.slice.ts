import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = {
	/** Глобальный Loader */
	isLoading: boolean;
};

const initialState: UiState = {
	isLoading: false,
};

const uiSlice = createSlice({
	name: "ui",
	initialState,
	reducers: {
		showLoader(state) {
			state.isLoading = true;
		},
		hideLoader(state) {
			state.isLoading = false;
		},
		setLoading(state, action: PayloadAction<boolean>) {
			state.isLoading = action.payload;
		},
	},
});

export const { showLoader, hideLoader, setLoading } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
