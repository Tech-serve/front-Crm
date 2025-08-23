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
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,

        px: { xs: 1, md: 2 },
        pt: { xs: 0, md: 0 },
        pb: { xs: "calc(72px + env(safe-area-inset-bottom))", md: 2 },

        gap: { xs: 1, md: 2 },
      }}
    >
      <Typography
        variant="h6"
        sx={{ mt: 0, mb: { xs: 1, md: 2 }, lineHeight: 1.2 }}
      >
        Сотрудники
      </Typography>

      {isError && (
        <Typography color="error">
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

          density="compact"
          rowHeight={44}
          columnHeaderHeight={44}
          hideFooterSelectedRowCount

          processRowUpdate={async (newRow: GridRowModel, oldRow: GridRowModel) => {
            const n = newRow as Employee;
            const o = oldRow as Employee;

            const body: Partial<Employee> = {};

            if (n.fullName !== o.fullName) body.fullName = (n.fullName ?? "").trim();
            if (n.email !== o.email)      body.email    = (n.email ?? "").trim().toLowerCase();
            if (n.phone !== o.phone)      body.phone    = n.phone ?? "";
            if (n.notes !== o.notes)      body.notes    = n.notes ?? "";

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
            "& .MuiDataGrid-virtualScroller": {
              overflowX: "auto",
            },
            "& .MuiDataGrid-footerContainer": {
              pb: { xs: "72px", md: 0 },
            },
            // выравнивания, что были у тебя — оставил
            "& .dg-center": { justifyContent: "center !important", px: 0 },
            "& .dg-center .MuiDataGrid-cellContent": { display: "flex", justifyContent: "center", width: "100%", overflow: "visible" },
            "& .dg-vcenter": { py: 0, alignItems: "center !important", display: "flex" },
            "& .dg-vcenter .MuiDataGrid-cellContent": { display: "flex", alignItems: "center", height: "100%" },
            "& .dg-vcenter .MuiFormControl-root": { margin: 0 },
            "& .dg-vcenter .MuiInputBase-root": { height: 36, alignItems: "center" },
            "& .dg-vcenter input": { textAlign: "center", paddingTop: 0, paddingBottom: 0 },
            border: 0,
          }}
        />
      </Box>

      <AddCandidateButton mode="employee" title="Добавить сотрудника" />
    </Box>
  );
}