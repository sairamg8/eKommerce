import { configureStore } from "@reduxjs/toolkit";
import auth_reducer from "./slices/auth/auth";
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";
import { auth_api } from "./slices/auth/auth_api";
import rtk_error_middleware from "./middleware";

const store = configureStore({
  reducer: {
    authSlice: auth_reducer,
    [auth_api.reducerPath]: auth_api.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat(
      rtk_error_middleware,
      auth_api.middleware,
    );
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
