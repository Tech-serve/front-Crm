import { baseApi } from "./baseApi";
import type { Candidate, Interview, Paginated, DepartmentValue } from "src/types/domain";

type CreateCandidateBody = {
  fullName: string;
  email: string;
  phone?: string;
  status?: string;
  department?: string;
  position?: string;
  notes?: string;
};

type UpdateCandidateBody = {
  notes?: string;
  status?: Candidate["status"];
  meetLink?: string;
  phone?: string;
  department?: DepartmentValue;
  position?: string;
  interviews?: Interview[];
  polygraphAt?: string | null;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  canceledAt?: string | null;
  fullName?: string;
  email?: string;
  polygraphAddress?: string | null;
};

type CandidateWithInterviews = Candidate & { interviews?: Interview[] };

type MetricsResp = {
  current: { not_held: number; reserve: number; success: number; declined: number; canceled: number };
  monthly: { month: string; polygraph: number; accepted: number; declined: number; canceled: number }[];
  firstTouches: { month: string; created: number }[];
};

type SnapshotsResp = {
  items: Array<{
    month: string; // YYYY-MM
    not_held: number;
    reserve: number;
    success: number;
    declined: number;
    canceled: number;
  }>;
};

type FreezeResp = {
  month: string; // YYYY-MM
  not_held: number;
  reserve: number;
  success: number;
  declined: number;
  canceled: number;
};

export const candidatesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCandidates: build.query<
      Paginated<CandidateWithInterviews>,
      { page?: number; pageSize?: number }
    >({
      query: ({ page = 1, pageSize = 1000 } = {}) =>
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
      query: (body) => ({ url: "/candidates", method: "POST", body }),
      invalidatesTags: [{ type: "Candidates", id: "LIST" }],
    }),

    patchCandidate: build.mutation<Candidate, { id: string; body: UpdateCandidateBody }>({
      query: ({ id, body }) => ({ url: `/candidates/${id}`, method: "PATCH", body }),
      invalidatesTags: (_res, _err, { id }) => [{ type: "Candidates", id }], // ← убран рефетч LIST
    }),

    getCandidateMetrics: build.query<MetricsResp, { from?: string; to?: string } | void>({
      query: (q) => {
        const params = new URLSearchParams();
        if (q?.from) params.set("from", q.from);
        if (q?.to) params.set("to", q.to);
        const qs = params.toString();
        return `/candidates/metrics${qs ? `?${qs}` : ""}`;
      },
    }),

    getCandidateSnapshots: build.query<SnapshotsResp, { from: string; to: string }>({
      query: ({ from, to }) => ({ url: "/candidates/snapshots", params: { from, to } }),
    }),

    freezeCandidateSnapshot: build.mutation<FreezeResp, { month?: string } | void>({
      query: (body) => ({
        url: "/candidates/snapshots/freeze",
        method: "POST",
        params: body?.month ? { month: body.month } : undefined,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCandidatesQuery,
  useCreateCandidateMutation,
  usePatchCandidateMutation,
  useGetCandidateMetricsQuery,
  useGetCandidateSnapshotsQuery,
  useFreezeCandidateSnapshotMutation,
} = candidatesApi;