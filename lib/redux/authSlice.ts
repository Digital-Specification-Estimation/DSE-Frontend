"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface LoginBodyDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  access_token: string;
  user: SignupResponseDto;
}

export interface SignupBodyDto {
  username: string;
  password: string;
  email: string;
  business_name: string;
  roles: any;
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
  token: string | null;
  user: {
    id: string;
    username: string;
    email: string;
    roles: any;
  } | null;
}

const loadAuthState = (): AuthState => {
  return {
    token: null,
    user: null,
  };
};

const initialState: AuthState = loadAuthState();
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<LoginResponseDto>) => {
      state.token = action.payload.access_token;
    },
    clearCredentials: (state) => {
      state.token = null;
      state.user = null;
    },
  },
});

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/auth",
  }),
  endpoints: (builder) => ({
    login: builder.mutation<any, LoginBodyDto>({
      query: (credentials) => ({
        url: "/login",
        method: "POST",
        body: credentials,
      }),
    }),
    signup: builder.mutation<any, SignupBodyDto>({
      query: (userData) => ({
        url: "/signup",
        method: "POST",
        body: userData,
      }),
    }),
  }),
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
export const { useLoginMutation, useSignupMutation } = authApi;
