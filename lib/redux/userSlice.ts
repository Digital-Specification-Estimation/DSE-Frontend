import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// -----------------------------
// Types
// -----------------------------
export type User = {
  id: string;
  username: string;
  email: string;
  role?: string[];
  avatar?: string;
  role_request_approval?: "PENDING" | "APPROVED" | "REJECTED";
  company_id?: string;
};

export type Privilege = {
  id: string;
  name: string;
  description?: string;
};

// Payloads
export type UpdateUserPayload = Partial<User> & { id: string };
export type UpdatePrivilegePayload = {
  userId: string;
  privileges: string[];
};
export type CreateUserPayload = Partial<User> & {
  password: string;
  company_id: string;
};
export type ApproveUserPayload = {
  id: string;
  role: string; // Add role to match UpdateRoleRequestDto
};
export type DeleteUserPayload = {
  id: string;
  company_id: string;
};

// -----------------------------
// API Slice
// -----------------------------
export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/users",
    credentials: "include",
  }),
  tagTypes: ["Users", "Privileges"],
  endpoints: (builder) => ({
    // -----------------------------
    // Queries
    // -----------------------------
    getUsers: builder.query<User[], void>({
      query: () => "/",
      providesTags: ["Users"],
    }),

    getPendingUsers: builder.query<User[], void>({
      query: () => "/pending-requests",
      providesTags: ["Users"],
    }),

    getPrivileges: builder.query<Privilege[], void>({
      query: () => "get-privileges",
      providesTags: ["Privileges"],
    }),

    getUser: builder.query<User, string>({
      query: (id) => `user/${id}`,
      providesTags: (result, error, id) => [{ type: "Users", id }],
    }),

    // -----------------------------
    // Mutations
    // -----------------------------
    createUser: builder.mutation<User, CreateUserPayload>({
      query: (data) => ({
        url: "add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),

    approveUser: builder.mutation<
      { success: boolean; id: string },
      ApproveUserPayload
    >({
      query: ({ id, role }) => ({
        url: `role-request/${id}`, // ✅ matches backend
        method: "PATCH", // ✅ matches backend
        body: { status: "APPROVED", role },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Users", id }],
    }),

    updateUser: builder.mutation<User, UpdateUserPayload>({
      query: (data) => ({
        url: `profile/${data.id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, data) => [
        { type: "Users", id: data.id },
      ],
    }),

    updateUserPicture: builder.mutation<User, { id: string; avatar: string }>({
      query: (data) => ({
        url: `profile-picture/${data.id}`,
        method: "PATCH",
        body: { avatar: data.avatar },
      }),
      invalidatesTags: (result, error, data) => [
        { type: "Users", id: data.id },
      ],
    }),

    deleteUser: builder.mutation<
      { success: boolean; id: string },
      DeleteUserPayload
    >({
      query: ({ id, company_id }) => ({
        url: `delete/${id}`,
        method: "DELETE",
        body: { company_id },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Users", id }],
    }),

    updatePrivileges: builder.mutation<
      { success: boolean },
      UpdatePrivilegePayload
    >({
      query: (data) => ({
        url: `update-privileges`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Privileges"],
    }),

    updateSinglePrivilege: builder.mutation<
      { success: boolean },
      UpdatePrivilegePayload
    >({
      query: (data) => ({
        url: `single-update-privileges`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Privileges"],
    }),
  }),
});

// -----------------------------
// Export Hooks
// -----------------------------
export const {
  useGetUsersQuery,
  useGetPendingUsersQuery,
  useGetPrivilegesQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useApproveUserMutation,
  useUpdateUserMutation,
  useUpdateUserPictureMutation,
  useDeleteUserMutation,
  useUpdatePrivilegesMutation,
  useUpdateSinglePrivilegeMutation,
} = userApi;
