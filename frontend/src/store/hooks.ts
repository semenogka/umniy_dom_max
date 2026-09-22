import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "./index";

/** Типизированный dispatch */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/** Типизированный selector */
export const useAppSelector = useSelector.withTypes<RootState>();
