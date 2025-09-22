import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const tradePositionApi = createApi({
  reducerPath: "tradePositionApi",
  baseQuery: fetchBaseQuery({
    // baseUrl: "https://dse-backend-production.up.railway.app/trade-position",

    baseUrl: "https://dse-backend-uv5d.onrender.com/trade-position",
    credentials: "include",
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
    // getTradeByLocationName: builder.query<any, string>({
    //   query: (locationName) => `trades-location-name/${locationName}`,
    // }),
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
    unassignTradeProjectId: builder.mutation({
      query: (id) => ({
        url: `unassign-project/${id}`,
        method: "PATCH",
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
  // useGetTradeByLocationNameQuery,
  useGetTradesQuery,
  useDeleteTradeMutation,
  useEditTradeMutation,
  useUnassignTradeProjectIdMutation,
  useGetNumberQuery,
} = tradePositionApi;
