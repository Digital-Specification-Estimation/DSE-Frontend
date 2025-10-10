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
    // getTradeByLocationName: builder.queryhttps://dse-backend-uv5d.onrender.com<any, string>({
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
    assignTradeToProject: builder.mutation<any, { projectId: string; tradePositionId: string }>({
      query: ({ projectId, tradePositionId }) => ({
        url: "assign-project",
        method: "POST",
        body: { projectId, tradePositionId },
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
  useAssignTradeToProjectMutation,
  useGetNumberQuery,
} = tradePositionApi;
