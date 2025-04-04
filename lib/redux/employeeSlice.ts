import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const employeeApi = createApi({
  reducerPath: "employeeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://dse-backend-production.up.railway.app/employee",
    // baseUrl: "http://localhost:4000/employee",
  }),
  endpoints: (builder) => ({
    addEmployee: builder.mutation({
      query: (data) => ({
        url: "add",
        method: "POST",
        body: data,
      }),
    }),
    editEmployee: builder.mutation({
      query: (data) => ({
        url: "edit",
        method: "PUT",
        body: data,
      }),
    }),
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
    }),
    deleteManyEmployees: builder.mutation({
      query: (ids) => ({
        url: `delete-many?ids=${ids.join(",")}`,
        method: "DELETE",
      }),
    }),
    getEmployees: builder.query<any, void>({
      query: () => ({
        url: "get/employees",
        method: "GET",
      }),
    }),
    getEmployeeNumber: builder.query({
      query: () => "get/number",
    }),
    getEmployee: builder.query({
      query: (id) => `get/employees/${id}`,
    }),
    getTotalPayroll: builder.query({
      query: ({ year, month }) => `payroll/${year}/${month}`,
    }),
    getDaysWorked: builder.query({
      query: (id) => `days-worked/${id}`,
    }),
    getPlannedVsActual: builder.query({
      query: (id) => `plannedVsActual-user/${id}`,
    }),
  }),
});

export const {
  useAddEmployeeMutation,
  useEditEmployeeMutation,
  useDeleteEmployeeMutation,
  useDeleteManyEmployeesMutation,
  useGetEmployeesQuery,
  useGetEmployeeNumberQuery,
  useGetEmployeeQuery,
  useGetTotalPayrollQuery,
  useGetDaysWorkedQuery,
  useGetPlannedVsActualQuery,
} = employeeApi;
