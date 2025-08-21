import { baseApi } from "./baseApi";
import type { Employee, Paginated } from "src/types/employee";

type CreateEmployeeBody = {
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string | null;
  notes?: string;
  birthdayAt?: string | null;
  hiredAt?: string | null;
};

type UpdateEmployeeBody = Partial<Pick<Employee, "fullName" | "email" | "phone" | "department" | "position" | "notes" | "hiredAt" | "birthdayAt">>;

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEmployees: build.query<Paginated<Employee>, { page?: number; pageSize?: number }>({
      query: ({ page = 1, pageSize = 20 } = {}) => `/employees?page=${page}&pageSize=${pageSize}`,
      providesTags: (res) =>
        res?.items
          ? [...res.items.map((e) => ({ type: "Employees" as const, id: e._id })), { type: "Employees" as const, id: "LIST" }]
          : [{ type: "Employees" as const, id: "LIST" }],
    }),
    createEmployee: build.mutation<Employee, CreateEmployeeBody>({
      query: (body) => ({ url: "/employees", method: "POST", body }),
      invalidatesTags: [{ type: "Employees", id: "LIST" }],
    }),
    patchEmployee: build.mutation<Employee, { id: string; body: UpdateEmployeeBody }>({
      query: ({ id, body }) => ({ url: `/employees/${id}`, method: "PATCH", body }),
      invalidatesTags: (_res, _err, { id }) => [{ type: "Employees", id }, { type: "Employees", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetEmployeesQuery, useCreateEmployeeMutation, usePatchEmployeeMutation } = employeesApi;