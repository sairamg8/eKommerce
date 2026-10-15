import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { auth_api } from "./auth_api";
import type { UserRes } from "../../../types/User";
import { useLocalStorage } from "../../../lib/useLocalStorage";

interface InitialState {
  is_logged_in: boolean;
  token: null | string;
  refresh_token: null | string;
  is_loading: boolean;
  user_info: UserRes["user"] | null;
}

const initialState = (): InitialState => {
  const refresh_token = useLocalStorage.get("refresh_token") || null;
  const token = useLocalStorage.get("token") || null;
  const user_info =
    (useLocalStorage.get("user_info") as UserRes["user"]) || null;

  return {
    is_logged_in: !!user_info?.email,
    token,
    refresh_token,
    is_loading: false,
    user_info: user_info,
  };
};

const auth_slice = createSlice({
  name: "auth",
  initialState: initialState(),
  reducers: {
    logout: (state) => {
      state.is_logged_in = false;
      state.token = null;
      state.refresh_token = null;
      useLocalStorage.delete("user_info");
      useLocalStorage.delete("token");
      useLocalStorage.delete("refresh_token");
    },
    setCredentials: (state, action) => {
      state.is_logged_in = true;
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(auth_api.endpoints.login.matchPending, (state) => {
      state.is_loading = true;
    });

    builder.addMatcher(
      auth_api.endpoints.login.matchFulfilled,
      (state, action: PayloadAction<UserRes>) => {
        const { insert } = useLocalStorage;
        const { access_token, refresh_token, user } = action.payload;

        state.is_loading = false;
        state.is_logged_in = true;
        state.token = action.payload.access_token;
        state.refresh_token = action.payload.refresh_token;

        insert("refresh_token", refresh_token);
        insert("access_token", access_token);

        insert("user_info", user);
      },
    );
    builder.addMatcher(auth_api.endpoints.login.matchRejected, (state) => {
      state.is_loading = false;
    });
  },
});

export const { logout, setCredentials } = auth_slice.actions;

export default auth_slice.reducer;
