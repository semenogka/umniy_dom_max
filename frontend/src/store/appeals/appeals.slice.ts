import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchHouseAppeals as fetchHouseAppealsRequest } from "@/api/appeals";
import { hideLoader, showLoader } from "@/store/ui/ui.slice";

import type { AppealsState } from "./appeals.types";

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

const appealsSlice = createSlice({
	name: "appeals",
	initialState,
	reducers: {},
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
			});
	},
});

export const appealsReducer = appealsSlice.reducer;
