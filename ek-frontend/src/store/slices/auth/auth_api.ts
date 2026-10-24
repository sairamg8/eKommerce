import type {
  Login,
  Reset_Password_Res,
  ResetPassword_argsT,
  SignupT,
  UserRes,
} from "../../../types/User";
import { api } from "../../api";
import { logout } from "./auth";

export const auth_api = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<UserRes, Login>({
      query: (body) => ({ url: `/user/login`, body, method: "POST" }),
      invalidatesTags: ["profile"],

      // If Current API call triggered we need to some other API call manually we can trigger like this

      // onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
      //   await queryFulfilled;
      //   dispatch(
      //     auth_api.endpoints.profile.initiate(undefined, {
      //       forceRefetch: true,
      //     }),
      //   );
      // },
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
        url: "/user/profile",
        method: "get",
      }),
      providesTags: ["profile"],
    }),

    logout: builder.mutation({
      query: (body) => ({ url: "/user/logout", body, method: "post" }),
      onQueryStarted: async (_args, { dispatch }) => {
        dispatch(logout());
      },
    }),
  }),
});
export const {
  useLoginMutation,
  useSignupMutation,
  useForgot_passwordMutation,
  useReset_passwordMutation,
  useProfileQuery,
  useLogoutMutation,
} = auth_api;
