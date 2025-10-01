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
        url: "edit",
        method: "PUT",
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
    getDailyAttendanceMonthly: builder.query<any, void>({
      query: () => "daily-percentage-monthly",
    }),
    getAttendanceHistory: builder.query({
      query: ({ employeeId, startDate, endDate }: { employeeId: string; startDate?: string; endDate?: string }) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        const queryString = params.toString();
        return `history/${employeeId}${queryString ? `?${queryString}` : ''}`;
      },
    }),
  }),
});

export const {
  useAddAttendanceMutation,
  useEditAttendanceMutation,
  useDeleteAttendanceMutation,
  useAddReasonMutation,
  useGetAttendanceQuery,
  useEditUserStatusMutation,
  useGetAttendanceByDateQuery,
  useDeleteManyAttendancesMutation,
  useGetDailyAttendanceMonthlyQuery,
  useGetAttendanceHistoryQuery,
} = attendanceApi;
