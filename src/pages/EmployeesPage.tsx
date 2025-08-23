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
    <Box p={{ xs: 0, md: 2 }} display="flex" flexDirection="column" height="100%" minHeight={0}>
      <Typography variant="h5" mb={2}>Сотрудники</Typography>

      <Box flex={1} minHeight={0} width="100%">
        <DataGrid
          rows={rows}
          columns={employeesColumns}
          loading={isLoading}
          getRowId={(r) => (r as Employee)._id}
          disableRowSelectionOnClick
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
            "& .dg-center": { justifyContent: "center !important", px: 0 },
            "& .dg-center .MuiDataGrid-cellContent": { display: "flex", justifyContent: "center", width: "100%", overflow: "visible" },
            "& .dg-vcenter": { py: 0, alignItems: "center !important", display: "flex" },
            "& .dg-vcenter .MuiDataGrid-cellContent": { display: "flex", alignItems: "center", height: "100%" },
            "& .dg-vcenter .MuiFormControl-root": { margin: 0 },
            "& .dg-vcenter .MuiInputBase-root": { height: 36, alignItems: "center" },
            "& .dg-vcenter input": { textAlign: "center", paddingTop: 0, paddingBottom: 0 },
          }}
        />
      </Box>

      <AddCandidateButton mode="employee" title="Добавить сотрудника" />
    </Box>
  );
}