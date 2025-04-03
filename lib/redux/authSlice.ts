"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface LoginBodyDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  user: SignupResponseDto;
  access_token?: string;
}

export interface SignupBodyDto {
  username: string;
  password: string;
  email: string;
  business_name: string;
}

export interface SignupResponseDto {
  id: string;
  username: string;
  email: string;
  password: string;
  refresh_token: string;
  company_id: string;
  business_name: string;
  google_id: string;
  apple_id: string;
  notification_sending: boolean;
  send_email_alerts: boolean;
  deadline_notify: boolean;
  image_url: string;
}

export enum RoleEnum {
  TALENT = "talent",
  ADMIN = "admin",
}

interface AuthState {
  user: SignupResponseDto | null;
}

const loadAuthState = (): AuthState => {
  return {
    user: null,
  };
};

const initialState: AuthState = loadAuthState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<LoginResponseDto>) => {
      state.user = action.payload.user;
    },
    clearCredentials: (state) => {
      state.user = null;
    },
  },
});

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    // baseUrl: "https://dse-backend-production.up.railway.app/auth",
    baseUrl: "http://localhost:4000/auth",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponseDto, LoginBodyDto>({
      query: (credentials) => ({
        url: "/login",
        method: "POST",
        body: credentials,
      }),
    }),
    signup: builder.mutation<SignupResponseDto, SignupBodyDto>({
      query: (userData) => ({
        url: "/signup",
        method: "POST",
        body: userData,
      }),
    }),
    googleLogin: builder.mutation<any, void>({
      query: () => ({
        url: "/google",
        method: "GET",
      }),
    }),
    logout: builder.mutation<any, void>({
      query: () => ({
        url: "/logout",
        method: "GET",
      }),
    }),
    session: builder.query<any, void>({
      query: () => ({
        url: "/session",
        method: "GET",
      }),
    }),
  }),
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;

export const {
  useLoginMutation,
  useSignupMutation,
  useGoogleLoginMutation,
  useLogoutMutation,
  useSessionQuery,
} = authApi;
