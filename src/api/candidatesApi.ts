import { baseApi } from "./baseApi";
import type { Candidate, Interview, Paginated, DepartmentValue } from "src/types/domain";

type CreateCandidateBody = {
  fullName: string
  email: string
  status?: string
  department?: string
  notes?: string
}

type UpdateCandidateBody = {
  notes?: string;
  status?: Candidate["status"];
  meetLink?: string;
  department?: DepartmentValue;
  interviews?: Interview[];
  polygraphAt?: string | null;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  canceledAt?: string | null;
  polygraphAddress?: string | null;
};

type CandidateWithInterviews = Candidate & { interviews?: Interview[] };

export const candidatesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCandidates: build.query<
      Paginated<CandidateWithInterviews>,
      { page?: number; pageSize?: number }
    >({
      query: ({ page = 1, pageSize = 20 } = {}) =>
        `/candidates?page=${page}&pageSize=${pageSize}`,
      providesTags: (res) =>
        res?.items
          ? [
              ...res.items.map((c) => ({ type: "Candidates" as const, id: c._id })),
              { type: "Candidates" as const, id: "LIST" },
            ]
          : [{ type: "Candidates" as const, id: "LIST" }],
    }),

    createCandidate: build.mutation<Candidate, CreateCandidateBody>({
      query: (body) => ({
        url: "/candidates",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Candidates", id: "LIST" }],
    }),

    patchCandidate: build.mutation<
      Candidate,
      { id: string; body: UpdateCandidateBody }
    >({
      query: ({ id, body }) => ({
        url: `/candidates/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Candidates", id },
        { type: "Candidates", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCandidatesQuery,
  useCreateCandidateMutation,
  usePatchCandidateMutation,
} = candidatesApi;