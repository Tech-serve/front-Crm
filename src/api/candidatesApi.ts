import { baseApi } from "./baseApi";
import type { Candidate, Interview, InterviewStatus, Paginated } from "src/types/domain";

/* ---------- типы ---------- */

type CreateCandidateBody = {
  fullName: string;
  email: string;
  notes?: string;
};

type UpdateCandidateBody = {
  status?:  InterviewStatus;   // 👈 добавили
  meetLink?: string;           // если решите менять ссылку
  notes?:   string;
  interviews?: Interview[];
};

type CandidateWithInterviews = Candidate & { interviews?: Interview[] };

/* ---------- endpoints ---------- */

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
              ...res.items.map((c) => ({ type:"Candidates" as const, id:c._id })),
              { type:"Candidates" as const, id:"LIST" },
            ]
          : [{ type:"Candidates" as const, id:"LIST" }],
    }),

    createCandidate: build.mutation<Candidate, CreateCandidateBody>({
      query: (body) => ({ url:"/candidates", method:"POST", body }),
      invalidatesTags: [{ type:"Candidates", id:"LIST" }],
    }),

    patchCandidate: build.mutation<
      Candidate,
      { id:string; body: UpdateCandidateBody }
    >({
      query: ({ id, body }) => ({ url:`/candidates/${id}`, method:"PATCH", body }),
      invalidatesTags: (_r,_e,{ id }) => [
        { type:"Candidates", id },
        { type:"Candidates", id:"LIST" },
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