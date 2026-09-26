import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { fetchUserHouses as fetchUserHousesRequest } from "@/api/houses";
import { getMaxUserId } from "@/max/webApp";
import { hideLoader, showLoader } from "@/store/ui/ui.slice";

import type { House, HousesState } from "./houses.types";

const initialState: HousesState = {
	items: [],
	selectedHouse: undefined,
	status: "idle",
	error: null,
};

/** Загрузка домов текущего пользователя MAX */
export const fetchUserHouses = createAsyncThunk(
	"houses/fetchUserHouses",
	async (_, { dispatch, rejectWithValue }) => {
		const userId = getMaxUserId();

		if (userId == null) {
			return rejectWithValue("Не удалось получить id пользователя MAX");
		}

		dispatch(showLoader());

		try {
			return await fetchUserHousesRequest(userId);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Не удалось загрузить дома";
			return rejectWithValue(message);
		} finally {
			dispatch(hideLoader());
		}
	},
);

const housesSlice = createSlice({
	name: "houses",
	initialState,
	reducers: {
		/** Выбор дома */
		selectHouse(state, action: PayloadAction<House>) {
			const house = state.items.find((item) => item.id === action.payload.id);
			if (house) state.selectedHouse = house;
		},
	},
	extraReducers: (builder) => {
		builder
			/** Старт загрузки домов */
			.addCase(fetchUserHouses.pending, (state) => {
				state.status = "loading";
				state.error = null;
			})
			/** Успешная загрузка домов */
			.addCase(fetchUserHouses.fulfilled, (state, action) => {
				state.status = "succeeded";
				state.items = action.payload;
				state.error = null;

				const selectedId = state.selectedHouse?.id;

				state.selectedHouse =
					state.items.find((house) => house.id === selectedId) ?? state.items[0];
			})
			/** Ошибка загрузки домов */
			.addCase(fetchUserHouses.rejected, (state, action) => {
				state.status = "failed";
				state.error =
					typeof action.payload === "string" ? action.payload : "Не удалось загрузить дома";
			});
	},
});

export const { selectHouse } = housesSlice.actions;
export const housesReducer = housesSlice.reducer;
