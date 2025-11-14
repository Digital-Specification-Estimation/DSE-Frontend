import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Types for enhanced project management
export interface ProjectTradeAssignment {
  tradeId: string;
  selectedEmployeeIds: string[];
  employeeCount?: number;
  selectionMode: "specific" | "count";
}

export interface EnhancedProjectData {
  id?: string;
  project_name: string;
  location_name: string;
  budget: number | string; // Allow both number and string for backend compatibility
  start_date: string;
  end_date: string;
  tradeAssignments?: ProjectTradeAssignment[];
}

export const projectApi = createApi({
  reducerPath: "projectApi",
  baseQuery: fetchBaseQuery({
    // baseUrl: "https://dse-backend-production.up.railway.app/project",

    baseUrl: "https://dse-backend-uv5d.onrender.com/project",
    credentials: "include",
  }),
  tagTypes: ["Projects"],
  endpoints: (builder) => ({
    getProjects: builder.query<any, void>({
      query: () => "projects",
      providesTags: ["Projects"],
    }),
    getProjectById: builder.query({
      query: (id) => `${id}`,
      providesTags: (result, error, id) => [{ type: "Projects", id }],
    }),
    getProjectWithTrades: builder.query({
      query: (id) => `${id}/with-trades`,
      providesTags: (result, error, id) => [{ type: "Projects", id }],
    }),
    addProject: builder.mutation<any, EnhancedProjectData>({
      query: (project) => ({
        url: "add",
        method: "POST",
        body: project,
      }),
      invalidatesTags: ["Projects"],
    }),
    updateProject: builder.mutation<any, EnhancedProjectData>({
      query: (project) => ({
        url: "edit",
        method: "PUT",
        body: project,
      }),
      invalidatesTags: ["Projects"],
    }),
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),
    assignTradesToProject: builder.mutation({
      query: ({ projectId, tradeAssignments }) => ({
        url: `${projectId}/assign-trades`,
        method: "POST",
        body: { tradeAssignments },
      }),
      invalidatesTags: ["Projects"],
    }),
    unassignTradeFromProject: builder.mutation({
      query: ({ projectId, tradeId }) => ({
        url: `${projectId}/unassign-trade/${tradeId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),
    getProjectEmployees: builder.query({
      query: (projectId) => `${projectId}/employees`,
      providesTags: (result, error, projectId) => [
        { type: "Projects", id: projectId },
      ],
    }),
    getProjectFinancialMetrics: builder.query<any, string>({
      query: (projectId) => `${projectId}/financial-metrics`,
      providesTags: (result, error, projectId) => [
        { type: "Projects", id: `${projectId}-metrics` },
      ],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useGetProjectWithTradesQuery,
  useAddProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAssignTradesToProjectMutation,
  useUnassignTradeFromProjectMutation,
  useGetProjectEmployeesQuery,
  useGetProjectFinancialMetricsQuery,
} = projectApi;
