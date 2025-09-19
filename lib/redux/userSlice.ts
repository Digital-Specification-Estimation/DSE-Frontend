import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://dse-backend-uv5d.onrender.com//users",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => "",
    }),
    getPrevieleges: builder.query<any, void>({
      query: () => "get-previeleges",
    }),
    getUser: builder.query({
      query: (id) => `user/${id}`,
    }),
    updateUser: builder.mutation({
      query: (data: any) => ({
        url: `profile/${data.id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    updateUserPicture: builder.mutation({
      query: (data: any) => ({
        url: `profile-picture/${data.id}`,
        method: "PATCH",
        body: data,
      }),
    }),
    deleteUser: builder.mutation({
      query: (id: any) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
    }),
    updatePrevieleges: builder.mutation({
      query: (data: any) => ({
        url: `update-previeleges`,
        method: "PATCH",
        body: data,
      }),
    }),
    updateSinglePrevieleges: builder.mutation({
      query: (data: any) => ({
        url: `single-update-previeleges`,
        method: "PATCH",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetPrevielegesQuery,
  useGetUserQuery,
  useUpdateUserMutation,
  useUpdateUserPictureMutation,
  useDeleteUserMutation,
  useUpdatePrevielegesMutation,
  useUpdateSinglePrevielegesMutation,
} = userApi;
