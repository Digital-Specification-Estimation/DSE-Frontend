import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const projectApi = createApi({
  reducerPath: "projectApi",
  baseQuery: fetchBaseQuery({
    // baseUrl: "https://dse-backend-production.up.railway.app/project",

    baseUrl: "https://dse-backend-uv5d.onrender.com/project",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getProjects: builder.query<any, void>({
      query: () => "projects",
    }),
    getProjectById: builder.query({
      query: (id) => `${id}`,
    }),
    addProject: builder.mutation({
      query: (project) => ({
        url: "add",
        method: "POST",
        body: project,
      }),
    }),
    updateProject: builder.mutation({
      query: (project) => ({
        url: "edit",
        method: "PUT",
        body: project,
      }),
    }),
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `delete/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useAddProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectApi;
