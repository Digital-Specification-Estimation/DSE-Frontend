import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const employeeApi = createApi({
  reducerPath: "employeeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/employee", // or your production baseUrl
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
  useGetTotalPayrollQuery,
  useGetDaysWorkedQuery,
  useGetPlannedVsActualQuery,
} = employeeApi;
