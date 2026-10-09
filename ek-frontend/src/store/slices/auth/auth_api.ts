import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Login, SignupT, UserRes } from "../../../types/User";

export const auth_api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
  }),
  endpoints: (builder) => ({
    login: builder.mutation<UserRes, Login>({
      query: (body) => ({ url: `/user/login`, body, method: "POST" }),
    }),

    signup: builder.mutation<UserRes, Omit<SignupT, "confirm_password">>({
      query: (body) => ({ url: "/user/signup", body, method: "POST" }),
    }),
  }),
});

export const { useLoginMutation, useSignupMutation } = auth_api;
