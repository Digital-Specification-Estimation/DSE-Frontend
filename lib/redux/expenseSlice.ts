import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const expenseApi = createApi({
  reducerPath: "expenseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://dse-backend-uv5d.onrender.com/expenses",
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Expense"],
  endpoints: (builder) => ({
    // Create a new expense
    createExpense: builder.mutation<ExpenseEntity, CreateExpenseDto>({
      query: (expenseData) => ({
        url: "/",
        method: "POST",
        body: expenseData,
      }),
      invalidatesTags: ["Expense"],
    }),

    // Get all expenses with optional filters
    getExpenses: builder.query<
      ExpenseEntity[],
      { projectId?: string; companyId?: string } | void
    >({
      query: (filters) => ({
        url: "/",
        params: filters || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Expense" as const, id })),
              "Expense",
            ]
          : ["Expense"],
    }),

    // Get expenses by project ID
    getExpensesByProject: builder.query<ExpenseEntity[], string>({
      query: (projectId) => `/project/${projectId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Expense" as const, id })),
              "Expense",
            ]
          : ["Expense"],
    }),

    // Get single expense by ID
    getExpense: builder.query<ExpenseEntity, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "Expense", id }],
    }),

    // Update an expense
    updateExpense: builder.mutation<
      ExpenseEntity,
      { id: string; data: Partial<UpdateExpenseDto> }
    >({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Expense", id }],
    }),

    // Delete an expense
    deleteExpense: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Expense", id }],
    }),
  }),
});

// Types based on the backend DTO
interface CreateExpenseDto {
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  project_id: string;
  company_id: string;
  date?: string;
}

interface UpdateExpenseDto {
  amount?: number | string;
  description?: string;
}

interface ExpenseEntity {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  project_id: string;
  company_id: string;
  date: string;
  created_at: string;
  updated_at: string;
  project?: any; // You might want to replace 'any' with a proper Project type
}

export const {
  useCreateExpenseMutation,
  useGetExpensesQuery,
  useGetExpensesByProjectQuery,
  useGetExpenseQuery,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expenseApi;
