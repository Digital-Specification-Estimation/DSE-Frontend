import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const attendanceApi = createApi({
  reducerPath: "attendanceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://dse-backend-production.up.railway.app/location",

    // baseUrl: "http://localhost:4000/attendance",
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
    deleteAttendance: builder.mutation({
      query: (id) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
    }),
    addReason: builder.mutation({
      query: (data) => ({
        url: "reason",
        method: "PATCH",
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
  }),
});

export const {
  useAddAttendanceMutation,
  useEditAttendanceMutation,
  useDeleteAttendanceMutation,
  useAddReasonMutation,
  useGetAttendanceQuery,
  useGetAttendanceByDateQuery,
  useDeleteManyAttendancesMutation,
} = attendanceApi;
