import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { auth_api } from "./auth_api";
import type { UserRes } from "../../../types/User";

interface InitialState {
  is_logged_in: boolean;
  token: null | string;
  refresh_token: null | string;
  is_loading: boolean;
}

const initialState: InitialState = {
  is_logged_in: false,
  token: null,
  refresh_token: null,
  is_loading: false,
};

const auth_slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.is_logged_in = false;
      state.token = null;
      state.refresh_token = null;
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
        state.is_loading = false;
        state.is_logged_in = true;
        state.token = action.payload.access_token;
        state.refresh_token = action.payload.refresh_token;
      },
    );
    builder.addMatcher(auth_api.endpoints.login.matchRejected, (state) => {
      state.is_loading = false;
    });
  },
});

export const { logout, setCredentials } = auth_slice.actions;

export default auth_slice.reducer;
