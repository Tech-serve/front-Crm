import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  useGetCandidatesQuery,
  usePatchCandidateMutation
} from "src/api/candidatesApi";
import candidatesColumns from "src/tables/candidatesTable";
import { HR_STATUS_OPTIONS } from "src/config/statusConfig";
import type { Candidate } from "src/types/domain";

export default function CandidatesPage() {
  const { data, isLoading, isError, error } = useGetCandidatesQuery({
    page: 1,
    pageSize: 20
  });

  const [patchCandidate] = usePatchCandidateMutation();

  const rows = useMemo(
    () =>
      (data?.items ?? []).map((c) => {
        const iv = c.interviews?.[0];
        const show =
          iv &&
          (iv.status === "success" || iv.status === "declined") &&
          iv.scheduledAt;

        const statusCode = iv?.status ?? "—";
        const statusLabel =
          HR_STATUS_OPTIONS.find((o) => o.value === statusCode)?.label ??
          statusCode;

        return {
          ...c,
          scheduledAtText: show
            ? new Date(iv.scheduledAt).toLocaleDateString()
            : "—",
          statusCode,
          statusLabel,
          meetLink: iv?.meetLink
        };
      }),
    [data]
  );

  return (
    <Box>
      <Typography variant="h5" mb={2}>
        Кандидаты
      </Typography>

      {isError && (
        <Typography color="error">
          Ошибка: {String((error as any)?.data || error)}
        </Typography>
      )}

      <div style={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={candidatesColumns}
          getRowId={(r) => (r as Candidate)._id}
          loading={isLoading}
          disableRowSelectionOnClick
          processRowUpdate={async (newRow, oldRow) => {
            const n = newRow as Candidate;
            const o = oldRow as Candidate;

            const body: any = {};
            if (n.fullName !== o.fullName) body.fullName = n.fullName?.trim();
            if (n.email !== o.email)       body.email    = n.email?.trim();
            if (n.notes !== o.notes)       body.notes    = n.notes;

            if (Object.keys(body).length > 0) {
              await patchCandidate({ id: n._id, body }).unwrap();
            }
            return newRow;
          }}
          onProcessRowUpdateError={(e) => console.error(e)}
        />
      </div>
    </Box>
  );
}