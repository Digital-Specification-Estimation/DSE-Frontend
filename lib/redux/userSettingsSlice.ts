import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface UserSettings {
  id?: string;
  role: string;
  company_id: string;
  full_access: boolean;
  approve_attendance: boolean;
  manage_payroll: boolean;
  view_reports: boolean;
  approve_leaves: boolean;
  view_payslip: boolean;
  mark_attendance: boolean;
  manage_employees: boolean;
  generate_reports: boolean;
}

export const userSettingsApi = createApi({
  reducerPath: "userSettingsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://dse-backend-uv5d.onrender.com/user-settings",
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["UserSettings", "Session"], // Add Session tag
  endpoints: (builder) => ({
    createUserSettings: builder.mutation<
      UserSettings,
      Omit<UserSettings, "id">
    >({
      query: (settings) => ({
        url: "/",
        method: "POST",
        body: settings,
      }),
      invalidatesTags: ["UserSettings", "Session"], // Invalidate Session
    }),
    updateUserSettings: builder.mutation<
      UserSettings,
      { id: string; updates: Partial<UserSettings> }
    >({
      query: ({ id, updates }) => ({
        url: `/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: ["UserSettings", "Session"], // Invalidate Session
    }),
    getCompanySettings: builder.query<UserSettings[], string>({
      query: (companyId) => `/company/${companyId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "UserSettings" as const,
                id,
              })),
              { type: "UserSettings", id: "LIST" },
            ]
          : [{ type: "UserSettings", id: "LIST" }],
    }),
    getRoleSettings: builder.query<
      UserSettings,
      { role: string; companyId: string }
    >({
      query: ({ role, companyId }) => `/role/${role}/company/${companyId}`,
      providesTags: (result, error, { role }) => [
        { type: "UserSettings", id: `${role}-${result?.id || "role"}` },
      ],
    }),
  }),
});

export const {
  useCreateUserSettingsMutation,
  useUpdateUserSettingsMutation,
  useGetCompanySettingsQuery,
  useGetRoleSettingsQuery,
} = userSettingsApi;
