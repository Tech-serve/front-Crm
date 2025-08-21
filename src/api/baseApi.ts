import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE,
    credentials: "include",
    prepareHeaders: (headers) => headers,
  }),
  tagTypes: ["Candidates", "Interviews", "Employees"],
  endpoints: () => ({}),
});