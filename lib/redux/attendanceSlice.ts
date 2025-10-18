import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const attendanceApi = createApi({
  reducerPath: "attendanceApi",
  baseQuery: fetchBaseQuery({
    // baseUrl: "https://dse-backend-production.up.railway.app/location",

    baseUrl: "https://dse-backend-uv5d.onrender.com/attendance",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    addAttendance: builder.mutation({
      query: (data) => ({
        url: "add",
        method: "POST",
        body: data,
      }),
    }),
    editAttendance: builder.mutation({
      query: (data) => ({
        url: "update",
        method: "PATCH",
        body: data,
      }),
    }),
    editUserStatus: builder.mutation({
      query: (data) => ({
        url: "edit-status-user",
        method: "PUT",
        body: data,
      }),
    }),
    deleteAttendance: builder.mutation({
      query: (id) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
    }),
    addReason: builder.mutation({
      query: (data) => ({
        url: "reason",
        method: "PUT",
        body: data,
      }),
    }),
    getAttendance: builder.query({
      query: ({ daysAgo, status }) => `time/${daysAgo}/${status}`,
    }),
    
    getAttendanceByDate: builder.query({
      query: ({ date, status }) => `by-date?date=${date}&status=${status}`,
    }),
    deleteManyAttendances: builder.mutation({
      query: (ids) => ({
        url: `delete-many?ids=${ids.join(",")}`,
        method: "DELETE",
      }),
    }),
    getUserAttendanceHistory: builder.query({
      query: ({ employeeId, startDate, endDate }) => {
        let url = `history/${employeeId}`;
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) url += `?${params.toString()}`;
        return url;
      },
    }),
    getAttendancesWithReasons: builder.query({
      query: ({ employeeId, startDate, endDate }) => {
        let url = `history/${employeeId}`;
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) url += `?${params.toString()}`;
        return url;
      },
    }),
    getDailyAttendancePercentage: builder.query({
      query: (companyId) => `daily-percentage/${companyId}`,
    }),
    getDailyAttendanceMonthly: builder.query({
      query: (companyId) => `daily-percentage-monthly`,
    }),
    // New payroll calculation endpoints
    calculateEmployeePayroll: builder.query({
      query: ({ employeeId, startDate, endDate }) => {
        let url = `payroll/${employeeId}`;
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) url += `?${params.toString()}`;
        return url;
      },
    }),
    calculateCompanyPayroll: builder.query({
      query: ({ companyId, startDate, endDate }) => {
        let url = `payroll/company/${companyId}`;
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) url += `?${params.toString()}`;
        return url;
      },
    }),
    calculateProjectPayroll: builder.query({
      query: ({ projectId, companyId, startDate, endDate }) => {
        let url = `payroll/project/${projectId}`;
        const params = new URLSearchParams();
        params.append('companyId', companyId);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return `${url}?${params.toString()}`;
      },
    }),
  }),
});

export const {
  useAddAttendanceMutation,
  useEditAttendanceMutation,
  useEditUserStatusMutation,
  useDeleteAttendanceMutation,
  useDeleteManyAttendancesMutation,
  useAddReasonMutation,
  useGetAttendanceQuery,
  useGetAttendanceByDateQuery,
  useGetUserAttendanceHistoryQuery,
  useGetAttendancesWithReasonsQuery,
  useGetDailyAttendancePercentageQuery,
  useGetDailyAttendanceMonthlyQuery,
  useCalculateEmployeePayrollQuery,
  useCalculateCompanyPayrollQuery,
  useCalculateProjectPayrollQuery,
} = attendanceApi;
