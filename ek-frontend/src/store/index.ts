import { configureStore } from "@reduxjs/toolkit";
import auth_reducer from "./slices/auth/auth";
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";
import { auth_api } from "./slices/auth/auth_api";

const store = configureStore({
  reducer: {
    auth: auth_reducer,
    [auth_api.reducerPath]: auth_api.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat(auth_api.middleware);
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
