import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useGetEmployeesQuery, usePatchEmployeeMutation } from "src/api/employeesApi";
import employeesColumns from "src/tables/employeesTable";
import type { Employee } from "src/types/employee";
import AddCandidateButton from "src/components/candidates/AddCandidateButton";

export default function EmployeesPage() {
  const { data, isLoading, isError, error } = useGetEmployeesQuery({ page: 1, pageSize: 20 });
  const [patchEmployee] = usePatchEmployeeMutation();

  const rows = useMemo(
    () =>
      (data?.items ?? []).map((e) => ({
        ...e,
        hiredAtText: e.hiredAt ? new Date(e.hiredAt).toLocaleDateString() : "—",
      })),
    [data]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", minHeight: 0 }}>
      <Typography variant="h5" mb={2}>Сотрудники</Typography>

      {isError && <Typography color="error">Ошибка: {String((error as any)?.data || error)}</Typography>}

      <Box sx={{ flex: 1, minHeight: 0, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={employeesColumns}
          getRowId={(r) => (r as Employee)._id}
          loading={isLoading}
          disableRowSelectionOnClick
          processRowUpdate={async (newRow, oldRow) => {
            const n = newRow as Employee;
            const o = oldRow as Employee;
            const body: any = {};
            if (n.fullName !== o.fullName) body.fullName = n.fullName?.trim();
            if (n.notes !== o.notes) body.notes = n.notes;
            if (Object.keys(body).length > 0) {
              await patchEmployee({ id: n._id, body }).unwrap();
            }
            return newRow;
          }}
          onProcessRowUpdateError={(e) => console.error(e)}
          sx={{ height: "88%" }}
        />
      </Box>

      <AddCandidateButton mode="employee" title="Добавить сотрудника" />
    </Box>
  );
}