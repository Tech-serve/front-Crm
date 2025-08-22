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
    () =>
      (data?.items ?? []).map((e) => ({
        ...e,
        id: e._id,
        hiredAtText: new Date(e.hiredAt).toLocaleDateString("uk-UA"),
      })),
    [data]
  );

  return (
    <Box p={2} display="flex" flexDirection="column" height="100%">
      <Typography variant="h5" mb={2}>Сотрудники</Typography>

      <Box flex={1}>
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
    // Горизонталь
    "& .dg-center": {
      justifyContent: "center !important",
      px: 0,
    },
    "& .dg-center .MuiDataGrid-cellContent": {
      display: "flex",
      justifyContent: "center",
      width: "100%",
      overflow: "visible",
    },

    // Вертикаль
    "& .dg-vcenter": {
      py: 0,                       // убираем вертикальные паддинги у клетки
      alignItems: "center !important",
      display: "flex",
    },
    "& .dg-vcenter .MuiDataGrid-cellContent": {
      display: "flex",
      alignItems: "center",
      height: "100%",              // растягиваем обёртку на всю высоту строки
    },

    // Сам TextField пикера — без внешних отступов и фикс. высота
    "& .dg-vcenter .MuiFormControl-root": { margin: 0 },
    "& .dg-vcenter .MuiInputBase-root": { height: 36, alignItems: "center" }, // small ≈36–40
    "& .dg-vcenter input": { textAlign: "center", paddingTop: 0, paddingBottom: 0 },
  }}
        />
      </Box>

      <AddCandidateButton mode="employee" title="Добавить сотрудника" />
    </Box>
  );
}