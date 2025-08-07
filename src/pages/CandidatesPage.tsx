import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import {
  useGetCandidatesQuery,
  usePatchCandidateMutation,
} from "src/api/candidatesApi";
import candidatesColumns from "src/tables/candidatesTable";
import type { Candidate } from "src/types/domain";

export default function CandidatesPage() {
  const {
    data,
    isLoading,
    isError,
    error,
  } = useGetCandidatesQuery({ page: 1, pageSize: 20 });

  const [patchCandidate] = usePatchCandidateMutation();

  // подготавливаем строки ----------------------------------------------------
  const rows = useMemo(
    () =>
      (data?.items ?? []).map((c) => {
        const last = c.interviews?.[0]; // берём «свежее» интервью, если есть
        return {
          ...c,
          scheduledAtText: last ? new Date(last.scheduledAt).toLocaleString() : "—",
          status:          last?.status   ?? "—",
          meetLink:        last?.meetLink ?? undefined,
        };
      }),
    [data],
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
          processRowUpdate={async (newRow) => {
            await patchCandidate({
              id:   (newRow as Candidate)._id,
              body: { notes: (newRow as Candidate).notes },
            }).unwrap();
            return newRow;
          }}
          onProcessRowUpdateError={(e) => console.error(e)}
        />
      </div>
    </Box>
  );
}