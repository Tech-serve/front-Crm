import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { DataGrid, type GridRowModel } from "@mui/x-data-grid";
import { useGetEmployeesQuery, usePatchEmployeeMutation } from "src/api/employeesApi";
import employeesColumns from "src/tables/employeesTable";
import type { Employee } from "src/types/employee";
import AddCandidateButton from "src/components/candidates/AddCandidateButton";

export default function EmployeesPage() {
  const { data, isLoading, isError, error } = useGetEmployeesQuery({ page: 1, pageSize: 20 });
  const [patchEmployee] = usePatchEmployeeMutation();

  const rows = useMemo(
    () => (data?.items ?? []).map((e) => ({ ...e, id: e._id })),
    [data]
  );

  return (
    <Box
      component="main"
      sx={{
        pt: { xs: 0, md: 0 },
        px: { xs: 1.5, md: 0 },
        pb: { xs: "calc(72px + env(safe-area-inset-bottom))", md: 0 },
        height: "90dvh",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Typography variant="h5" sx={{ mb: { xs: 1, md: 1 } }}>
        Сотрудники
      </Typography>

      {isError && (
        <Typography color="error" sx={{ mb: 1 }}>
          Ошибка: {String((error as any)?.data || error)}
        </Typography>
      )}

      <Box sx={{ flex: 1, minHeight: 0, width: "100%", overflow: "hidden" }}>
        <DataGrid
          rows={rows}
          columns={employeesColumns}
          loading={isLoading}
          getRowId={(r) => (r as Employee)._id}
          disableRowSelectionOnClick
          /** ✅ добавили класс для уволенных */
          getRowClassName={(params) =>
            (params.row as Employee)?.terminatedAt ? "row--terminated" : ""
          }
          processRowUpdate={async (newRow: GridRowModel, oldRow: GridRowModel) => {
            const n = newRow as Employee;
            const o = oldRow as Employee;

            const body: Partial<Employee> = {};

            if (n.fullName !== o.fullName) body.fullName = (n.fullName ?? "").trim();
            if (n.email !== o.email) body.email = (n.email ?? "").trim().toLowerCase();
            if (n.phone !== o.phone) body.phone = n.phone ?? "";
            if (n.notes !== o.notes) body.notes = n.notes ?? "";

            if (Object.keys(body).length) {
              if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
                throw new Error("Некорректный email");
              }
              if (body.phone && !/^[\d\s()+-]{5,}$/.test(body.phone)) {
                throw new Error("Некорректный телефон");
              }
              await patchEmployee({ id: n._id, body }).unwrap();
            }
            return { ...n };
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
            "& .dg-center": { justifyContent: "center !important", px: 0 },
            "& .dg-center .MuiDataGrid-cellContent": {
              display: "flex",
              justifyContent: "center",
              width: "100%",
              overflow: "visible",
            },
            "& .dg-vcenter": { py: 0, alignItems: "center !important", display: "flex" },
            "& .dg-vcenter .MuiDataGrid-cellContent": {
              display: "flex",
              alignItems: "center",
              height: "100%",
            },
            "& .dg-vcenter .MuiFormControl-root": { margin: 0 },
            "& .dg-vcenter .MuiInputBase-root": { height: 36, alignItems: "center" },
            "& .dg-vcenter input": { textAlign: "center", paddingTop: 0, paddingBottom: 0 },

            "& .MuiDataGrid-row.row--terminated": {
              backgroundColor: "rgba(239,68,68,0.10)", // прозрачно-красный
            },
            "& .MuiDataGrid-row.row--terminated:hover": {
              backgroundColor: "rgba(239,68,68,0.18)",
            },
            "& .MuiDataGrid-row.row--terminated .MuiDataGrid-cell": {
              borderColor: "rgba(239,68,68,0.20)",
            },
          }}
        />
      </Box>

      <AddCandidateButton mode="employee" title="Добавить сотрудника" />
    </Box>
  );
}