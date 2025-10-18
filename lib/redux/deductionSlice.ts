import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Deduction {
  id: string;
  name: string;
  amount: number;
  description?: string;
  employee_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDeductionDto {
  name: string;
  amount: number;
  type: string;
  reason?: string;
  date?: string;
  employee_id: string;
}

export interface UpdateDeductionDto extends Partial<CreateDeductionDto> {}

export const deductionApi = createApi({
  reducerPath: "deductionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/deductions",
    credentials: "include",
  }),
  tagTypes: ["Deductions"],
  endpoints: (builder) => ({
    // Create a new deduction
    createDeduction: builder.mutation<Deduction, CreateDeductionDto>({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Deductions"],
    }),

    // Get all deductions, optionally filtered by employeeId
    getDeductions: builder.query<Deduction[], { employeeId?: string } | void>({
      query: (params) => {
        if (params?.employeeId) {
          return `/employee/${params.employeeId}`;
        }
        return "/";
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Deductions" as const, id })),
              { type: "Deductions", id: "LIST" },
            ]
          : [{ type: "Deductions", id: "LIST" }],
    }),

    // Get a single deduction by ID
    getDeduction: builder.query<Deduction, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "Deductions", id }],
    }),

    // Update a deduction
    updateDeduction: builder.mutation<Deduction, { id: string; data: UpdateDeductionDto }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Deductions", id },
        { type: "Deductions", id: "LIST" },
      ],
    }),

    // Delete a deduction
    deleteDeduction: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Deductions", id },
        { type: "Deductions", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useCreateDeductionMutation,
  useGetDeductionsQuery,
  useGetDeductionQuery,
  useUpdateDeductionMutation,
  useDeleteDeductionMutation,
} = deductionApi;
