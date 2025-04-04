import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const tradePositionApi = createApi({
  reducerPath: "tradePositionApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/trade-position" }),
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
    getTrades: builder.query({
      query: () => "get/trades",
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
