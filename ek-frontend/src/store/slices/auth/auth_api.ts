import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  Login,
  Reset_Password_Res,
  ResetPassword_argsT,
  SignupT,
  UserRes,
} from "../../../types/User";

export const auth_api = createApi({
  reducerPath: "auth",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:3000",
  }),
  endpoints: (builder) => ({
    login: builder.mutation<UserRes, Login>({
      query: (body) => ({ url: `/user/login`, body, method: "POST" }),
    }),

    signup: builder.mutation<UserRes, Omit<SignupT, "confirm_password">>({
      query: (body) => ({ url: "/user/signup", body, method: "POST" }),
    }),

    forgot_password: builder.mutation({
      query: (body) => ({
        body,
        url: "/user/forgot-password",
        method: "POST",
      }),
    }),

    reset_password: builder.mutation<Reset_Password_Res, ResetPassword_argsT>({
      query: ({ password, token }) => ({
        url: "/user/reset-password",
        method: "post",
        body: { password },
        params: { token },
      }),
    }),

    profile: builder.query({
      query: () => ({
        url: "/profile",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useForgot_passwordMutation,
  useReset_passwordMutation,
  useProfileQuery,
} = auth_api;
