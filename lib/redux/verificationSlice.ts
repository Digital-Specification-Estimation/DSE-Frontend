import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface RequestVerificationCodeDto {
  email: string;
}

export interface VerifyEmailDto {
  email: string;
  code: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
}

interface VerificationState {
  isVerificationSent: boolean;
  isVerified: boolean;
  error: string | null;
  loading: boolean;
}

const initialState: VerificationState = {
  isVerificationSent: false,
  isVerified: false,
  error: null,
  loading: false,
};

const verificationSlice = createSlice({
  name: "verification",
  initialState,
  reducers: {
    resetVerificationState: (state) => {
      state.isVerificationSent = false;
      state.isVerified = false;
      state.error = null;
      state.loading = false;
    },
    setVerificationSent: (state, action: PayloadAction<boolean>) => {
      state.isVerificationSent = action.payload;
    },
    setVerified: (state, action: PayloadAction<boolean>) => {
      state.isVerified = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const verificationApi = createApi({
  reducerPath: "verificationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `http://localhost:4000/verification`,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    requestVerificationCode: builder.mutation<
      { message: string },
      RequestVerificationCodeDto
    >({
      query: (body) => ({
        url: "/request",
        method: "POST",
        body,
      }),
    }),
    verifyEmail: builder.mutation<VerificationResponse, VerifyEmailDto>({
      query: (body) => ({
        url: "/verify",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  resetVerificationState,
  setVerificationSent,
  setVerified,
  setError,
  setLoading,
} = verificationSlice.actions;

export const { useRequestVerificationCodeMutation, useVerifyEmailMutation } =
  verificationApi;

export default verificationSlice.reducer;
