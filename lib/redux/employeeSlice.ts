import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const employeeApi = createApi({
  reducerPath: "employeeApi",
  baseQuery: fetchBaseQuery({
    // baseUrl: "https://dse-backend-production.up.railway.app/employee",

    baseUrl: "https://dse-backend-uv5d.onrender.com/employee",
    credentials: "include",
  }),
  tagTypes: ["Employees"],
  endpoints: (builder) => ({
    addEmployee: builder.mutation<any, any>({
      query: (data) => ({
        url: "add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Employees"],
    }),
    editEmployee: builder.mutation<any, any>({
      query: (data) => ({
        url: "edit",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Employees"],
    }),
    deleteEmployee: builder.mutation<any, string>({
      query: (id) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employees"],
    }),
    deleteManyEmployees: builder.mutation<any, string[]>({
      query: (ids) => ({
        url: `delete-many?ids=${ids.join(",")}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employees"],
    }),
    getEmployees: builder.query<any[], void>({
      query: () => "get/employees",
      providesTags: ["Employees"],
    }),
    getEmployeeNumber: builder.query<any, void>({
      query: () => "get/number",
    }),
    getEmployee: builder.query<any, string>({
      query: (id) => `get/employees/${id}`,
    }),
    getEmployeesByTrade: builder.query<any[], string>({
      query: (tradeId) => `get/employees/by-trade/${tradeId}`,
      providesTags: ["Employees"],
    }),
    getTotalPayroll: builder.query<any, { year: number; month: number }>({
      query: ({ year, month }) => `payroll/${year}/${month}`,
    }),
    getDaysWorked: builder.query<any, string>({
      query: (id) => `days-worked/${id}`,
    }),
    getPlannedVsActual: builder.query<any, string>({
      query: (id) => `plannedVsActual-user/${id}`,
    }),
    getMonthlyStats: builder.query<any, void>({
      query: () => "monthly-stats",
      // keepUnusedDataFor: 3600, // 1 hour in seconds
    }),
    updateEmployeeProject: builder.mutation<any, { employeeId: string; projectId: string | null }>({
      query: ({ employeeId, projectId }) => ({
        url: `${employeeId}/project`,
        method: "PATCH",
        body: { projectId },
      }),
      invalidatesTags: ["Employees"],
    }),
    updateEmployeesProject: builder.mutation<any, { employeeIds: string[]; projectId: string | null }>({
      query: ({ employeeIds, projectId }) => ({
        url: "update-project",
        method: "PUT",
        body: { employeeIds, projectId },
      }),
      invalidatesTags: ["Employees"],
    }),
  }),
});

export const {
  useAddEmployeeMutation,
  useEditEmployeeMutation,
  useDeleteEmployeeMutation,
  useDeleteManyEmployeesMutation,
  useGetEmployeesQuery,
  useGetMonthlyStatsQuery,
  useGetEmployeeNumberQuery,
  useGetEmployeeQuery,
  useGetEmployeesByTradeQuery,
  useGetTotalPayrollQuery,
  useGetDaysWorkedQuery,
  useGetPlannedVsActualQuery,
  useUpdateEmployeeProjectMutation,
  useUpdateEmployeesProjectMutation,
} = employeeApi;
