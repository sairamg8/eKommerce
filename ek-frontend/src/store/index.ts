import { configureStore } from "@reduxjs/toolkit";
import auth_reducer from "./slices/auth/auth";
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";
import rtk_error_middleware from "./middleware";
import { api } from "./api";

const store = configureStore({
  reducer: {
    authSlice: auth_reducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat(rtk_error_middleware, api.middleware);
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
