import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const locationApi = createApi({
  reducerPath: "locationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://dse-backend-production.up.railway.app/location",
    // baseUrl: "http://localhost:4000/location",
  }),
  endpoints: (builder) => ({
    getLocations: builder.query<any, void>({
      query: () => "locations",
    }),
    getLocationById: builder.query({
      query: (id) => `${id}`,
    }),
    addLocation: builder.mutation({
      query: (location) => ({
        url: "add",
        method: "POST",
        body: location,
      }),
    }),
    editLocation: builder.mutation({
      query: (location) => ({
        url: "edit",
        method: "PUT",
        body: location,
      }),
    }),
    deleteLocation: builder.mutation({
      query: (id) => ({
        url: `${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetLocationsQuery,
  useGetLocationByIdQuery,
  useAddLocationMutation,
  useEditLocationMutation,
  useDeleteLocationMutation,
} = locationApi;
