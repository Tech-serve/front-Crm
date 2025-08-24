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
import AddCandidateButton from "src/components/candidates/AddCandidateButton";

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

        const show = Boolean(iv?.scheduledAt);

        const statusCode = (iv?.status as string) ?? (c as any)?.status ?? "not_held";
        const statusLabel =
          HR_STATUS_OPTIONS.find((o) => o.value === statusCode)?.label ?? statusCode;

        return {
          ...c,
          scheduledAtText: show
            ? new Date(iv!.scheduledAt).toLocaleDateString()
            : "—",
          statusCode,
          statusLabel,
          meetLink: iv?.meetLink ?? c.meetLink
        };
      }),
    [data]
  );

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 0, md: 0 },
        px: { xs: 1.5, md: 0 }, 
        pb: { xs: "calc(72px + env(safe-area-inset-bottom))", md: 0 },
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        boxSizing: "border-box",
        overflow: "hidden", 
      }}
    >
      <Typography variant="h5" sx={{ mb: { xs: 1, md: 1 } }}>
        Кандидаты
      </Typography>

      {isError && (
        <Typography color="error" sx={{ mb: 1 }}>
          Ошибка: {String((error as any)?.data || error)}
        </Typography>
      )}

      <Box
        sx={{ flex: 1, minHeight: 0, width: "100%", overflow: "hidden" }}
      >
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
          sx={{
            height: "100%",
            width: "100%",
            border: 0,
            "& .MuiDataGrid-main": { height: "100%" },
            "& .MuiDataGrid-virtualScroller": {
              overflowY: "auto",
              paddingBottom: { xs: 1, md: 0 },
            }, 
            "& .MuiDataGrid-columnHeaders": {
              borderRadius: { xs: 1, md: 2 },
            },
          }}
        />
      </Box>

      <AddCandidateButton title="Добавить кандидата" />
    </Box>
  );
}