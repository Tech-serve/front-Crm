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
          meetLink: iv?.meetLink ?? c.meetLink
        };
      }),
    [data]
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,

        // убрать лишние поля/отступы, но оставить комфортные паддинги
        px: { xs: 1, md: 2 },
        pt: { xs: 0, md: 0 },

        // чтобы нижнее меню (bottom nav) не перекрывало строки
        pb: { xs: "calc(72px + env(safe-area-inset-bottom))", md: 2 },

        gap: { xs: 1, md: 2 },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mt: 0,
          mb: { xs: 1, md: 2 },
          lineHeight: 1.2,
        }}
      >
        Кандидаты
      </Typography>

      {isError && (
        <Typography color="error">
          Ошибка: {String((error as any)?.data || error)}
        </Typography>
      )}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          // перестраховка на случай специфики контейнера
          overflow: "hidden",
        }}
      >
        <DataGrid
          rows={rows}
          columns={candidatesColumns}
          getRowId={(r) => (r as Candidate)._id}
          loading={isLoading}
          disableRowSelectionOnClick

          // компактнее на мобиле
          density="compact"
          rowHeight={44}
          columnHeaderHeight={44}

          // если нужен футер — оставляем; если мешает, можно hideFooter
          hideFooterSelectedRowCount

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
            // лёгкое ужатие внутренних отступов
            "& .MuiDataGrid-columnHeaders": {
              minHeight: 44,
              maxHeight: 44,
            },
            "& .MuiDataGrid-columnHeader": {
              px: 1,
            },
            "& .MuiDataGrid-cell": {
              py: 0.75,
              px: 1,
            },
            // убрать “лишние серые блоки/отступы” по краям
            "& .MuiDataGrid-virtualScroller": {
              overflowX: "auto",
            },
            // отступ снизу внутри самого грида на мобиле
            "& .MuiDataGrid-footerContainer": {
              pb: { xs: "72px", md: 0 },
            },
            border: 0,
          }}
        />
      </Box>

      <AddCandidateButton title="Добавить кандидата" />
    </Box>
  );
}