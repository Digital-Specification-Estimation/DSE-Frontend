import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const boqApi = createApi({
  reducerPath: "boqApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/boq",
    credentials: "include",
  }),
  tagTypes: ["BOQ"],
  endpoints: (builder) => ({
    createBOQ: builder.mutation({
      query: (data) => ({
        url: "create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["BOQ"],
    }),
    getBOQByProject: builder.query({
      query: ({ projectId, companyId }) => `project/${projectId}?companyId=${companyId}`,
      providesTags: ["BOQ"],
    }),
    getBOQSummary: builder.query({
      query: ({ projectId, companyId }) => `project/${projectId}/summary?companyId=${companyId}`,
      providesTags: ["BOQ"],
    }),
    getAllBOQ: builder.query({
      query: (companyId) => `company/${companyId}`,
      providesTags: ["BOQ"],
    }),
    updateBOQ: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["BOQ"],
    }),
    updateBOQProgress: builder.mutation({
      query: ({ id, completed_quantity }) => ({
        url: `${id}/progress`,
        method: "PATCH",
        body: { completed_quantity },
      }),
      invalidatesTags: ["BOQ"],
    }),
    deleteBOQ: builder.mutation({
      query: (id) => ({
        url: `${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BOQ"],
    }),
    bulkCreateBOQ: builder.mutation({
      query: (data) => ({
        url: "bulk-create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["BOQ"],
    }),
  }),
});

export const {
  useCreateBOQMutation,
  useGetBOQByProjectQuery,
  useGetBOQSummaryQuery,
  useGetAllBOQQuery,
  useUpdateBOQMutation,
  useUpdateBOQProgressMutation,
  useDeleteBOQMutation,
  useBulkCreateBOQMutation,
} = boqApi;
