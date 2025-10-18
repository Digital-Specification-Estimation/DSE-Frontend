import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface RevenueEntry {
  id?: string;
  project_id: string;
  company_id: string;
  boq_item_id: string;
  boq_item_no: string;
  boq_description: string;
  from_date: string;
  to_date: string;
  quantity_completed: number;
  rate: number;
  unit: string;
  amount: number;
  created_at?: string;
  updated_at?: string;
}

export const revenueApi = createApi({
  reducerPath: "revenueApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://dse-backend-uv5d.onrender.com0/cost-control",
    credentials: "include",
  }),
  tagTypes: ["Revenue"],
  endpoints: (builder) => ({
    createRevenue: builder.mutation<RevenueEntry, Partial<RevenueEntry>>({
      query: (data) => ({
        url: "revenues",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Revenue"],
    }),
    getRevenuesByProject: builder.query<RevenueEntry[], string>({
      query: (projectId) => `revenues/project/${projectId}`,
      providesTags: ["Revenue"],
    }),
    updateRevenue: builder.mutation<RevenueEntry, { id: string } & Partial<RevenueEntry>>({
      query: ({ id, ...data }) => ({
        url: `revenues/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Revenue"],
    }),
    deleteRevenue: builder.mutation<void, string>({
      query: (id) => ({
        url: `revenues/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Revenue"],
    }),
    getProjectRevenueSummary: builder.query<any, { projectId: string; companyId: string }>({
      query: ({ projectId, companyId }) => `revenues/project/${projectId}/summary?companyId=${companyId}`,
      providesTags: ["Revenue"],
    }),
  }),
});

export const {
  useCreateRevenueMutation,
  useGetRevenuesByProjectQuery,
  useUpdateRevenueMutation,
  useDeleteRevenueMutation,
  useGetProjectRevenueSummaryQuery,
} = revenueApi;
