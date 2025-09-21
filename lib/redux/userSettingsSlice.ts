import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface UserSettings {
  id?: string;
  role: string;
  companyId: string;
  fullAccess: boolean;
  approveAttendance: boolean;
  managePayroll: boolean;
  viewReports: boolean;
  approveLeaves: boolean;
  viewPayslip: boolean;
  markAttendance: boolean;
  manageEmployees: boolean;
  generateReports: boolean;
}

export const userSettingsApi = createApi({
  reducerPath: 'userSettingsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://dse-backend-uv5d.onrender.com/user-settings',
    prepareHeaders: (headers, { getState }) => {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      // If we have a token, set the authorization header
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      
      return headers;
    },
  }),
  tagTypes: ['UserSettings'],
  endpoints: (builder) => ({
    // Create user settings
    createUserSettings: builder.mutation<UserSettings, Omit<UserSettings, 'id'>>({
      query: (settings) => ({
        url: '/',
        method: 'POST',
        body: settings,
      }),
      invalidatesTags: ['UserSettings'],
    }),

    // Update user settings
    updateUserSettings: builder.mutation<{
      id: string;
      updates: Partial<UserSettings>;
    }, UserSettings>({
      query: ({ id, updates }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['UserSettings'],
    }),

    // Get all settings for a company
    getCompanySettings: builder.query<UserSettings[], string>({
      query: (companyId) => `/company/${companyId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'UserSettings' as const, id })),
              { type: 'UserSettings', id: 'LIST' },
            ]
          : [{ type: 'UserSettings', id: 'LIST' }],
    }),

    // Get settings by role and company
    getRoleSettings: builder.query<
      UserSettings,
      { role: string; companyId: string }
    >({
      query: ({ role, companyId }) => `/role/${role}/company/${companyId}`,
      providesTags: (result, error, { role }) => [
        { type: 'UserSettings', id: `${role}-${result?.id || 'role'}` },
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
