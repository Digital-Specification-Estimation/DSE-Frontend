import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const tradePositionApi = createApi({
  reducerPath: "tradePositionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://dse-backend-production.up.railway.app/trade-position",
    // baseUrl: "http://localhost:4000/trade-position",
  }),
  endpoints: (builder) => ({
    addTrade: builder.mutation({
      query: (trade) => ({
        url: "add",
        method: "POST",
        body: trade,
      }),
    }),
    getTrade: builder.query({
      query: (id) => `get/${id}`,
    }),
    getTrades: builder.query<any, void>({
      // query: () => ({ url: "trades", method: "GET" }),
      query: () => "trades",
    }),
    deleteTrade: builder.mutation({
      query: (id) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
    }),
    editTrade: builder.mutation({
      query: (trade) => ({
        url: "edit",
        method: "PUT",
        body: trade,
      }),
    }),
    getNumber: builder.query({
      query: () => "number",
    }),
  }),
});

export const {
  useAddTradeMutation,
  useGetTradeQuery,
  useGetTradesQuery,
  useDeleteTradeMutation,
  useEditTradeMutation,
  useGetNumberQuery,
} = tradePositionApi;
