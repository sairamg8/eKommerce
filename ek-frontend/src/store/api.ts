import {
  createApi,
  fetchBaseQuery,
  type BaseQueryApi,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from ".";
import { logout, setCredentials } from "./slices/auth/auth";

const base_query = fetchBaseQuery({
  baseUrl: "http://localhost:3000",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).authSlice.token;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

async function refresh_tokens(api: BaseQueryApi, extra: {}) {
  const refresh_token = (api.getState() as RootState).authSlice.refresh_token;

  if (!refresh_token) {
    api.dispatch(logout());
    return false;
  }

  const res = await base_query(
    { url: "/user/refresh_token", body: { refresh_token }, method: "POST" },
    api,
    extra,
  );

  if (res.data) {
    api.dispatch(setCredentials(res.data));
    return true;
  }

  api.dispatch(logout());
  return false;
}

let refresh_promise: Promise<boolean> | null = null;

function refresh_once(api: BaseQueryApi, extra: {}) {
  if (!refresh_promise) {
    refresh_promise = refresh_tokens(api, extra).finally(() => {
      refresh_promise = null;
    });
  }
  return refresh_promise;
}

const base_query_with_reauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extra) => {
  let result = await base_query(args, api, extra);

  if (result.error?.status === 401) {
    const ok = await refresh_once(api, extra);

    if (ok) result = await base_query(args, api, extra);
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: base_query_with_reauth,
  endpoints: () => ({}),
  tagTypes: ["profile"],
});
