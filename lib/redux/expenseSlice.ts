import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const expenseApi = createApi({
  reducerPath: "expenseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/expenses",
    credentials: "include",
    prepareHeaders: (headers) => {
      // Get token from localStorage
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Expense"],
  endpoints: (builder) => ({
    createExpense: builder.mutation({
      query: (data) => ({
        url: "",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Expense"],
    }),
    getExpenses: builder.query({
      query: (companyId) => `company/${companyId}`,
      providesTags: ["Expense"],
    }),
    getExpensesByProject: builder.query({
      query: ({ projectId, companyId }) => `project/${projectId}?companyId=${companyId}`,
      providesTags: ["Expense"],
    }),
    updateExpense: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Expense"],
    }),
    deleteExpense: builder.mutation({
      query: ({ id, companyId }) => ({
        url: `${id}?companyId=${companyId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Expense"],
    }),
    bulkUploadExpenses: builder.mutation({
      query: ({ projectId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        return {
          url: 'bulk-upload',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ["Expense"],
    }),
  }),
});

export const {
  useCreateExpenseMutation,
  useGetExpensesQuery,
  useGetExpensesByProjectQuery,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useBulkUploadExpensesMutation,
} = expenseApi;
