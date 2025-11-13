import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const boqApi = createApi({
  reducerPath: "boqApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://dse-backend-uv5d.onrender.com/cost-control",
    credentials: "include",
  }),
  tagTypes: ["BOQ"],
  endpoints: (builder) => ({
    createBOQ: builder.mutation({
      query: (data) => ({
        url: "boq-items",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["BOQ"],
    }),
    getBOQByProject: builder.query({
      query: ({ projectId }) => `boq-items/project/${projectId}`,
      providesTags: ["BOQ"],
    }),
    getBOQSummary: builder.query({
      query: ({ projectId, companyId }) =>
        `project/${projectId}/summary?companyId=${companyId}`,
      providesTags: ["BOQ"],
    }),
    getAllBOQ: builder.query({
      query: (companyId) => `company/${companyId}`,
      providesTags: ["BOQ"],
    }),
    updateBOQ: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `boq-items/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["BOQ"],
    }),
    updateBOQProgress: builder.mutation({
      query: ({ id, completed_quantity }) => ({
        url: `boq-items/${id}/progress`,
        method: "PATCH",
        body: { completed_quantity },
      }),
      invalidatesTags: ["BOQ"],
    }),
    deleteBOQ: builder.mutation({
      query: (id) => ({
        url: `boq-items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BOQ"],
    }),
    bulkCreateBOQ: builder.mutation({
      query: ({ projectId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `boq-items/bulk/${projectId}`,
          method: "POST",
          body: formData,
        };
      },
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
