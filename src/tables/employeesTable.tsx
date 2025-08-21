import type { GridColDef } from "@mui/x-data-grid";
import DepartmentCell from "src/tables/cells/DepartmentCell";
import PositionCell from "src/tables/cells/PositionCell";
import EmployeeBirthdayCell from "src/tables/cells/EmployeeBirthdayCell";

const employeesColumns: GridColDef[] = [
  { field: "fullName", headerName: "Сотрудник", flex: 1, minWidth: 180, editable: true },
  { field: "email", headerName: "Email", width: 220 },
  { field: "phone", headerName: "Телефон", width: 160 },
  {
    field: "department",
    headerName: "Отдел",
    width: 160,
    sortable: false,
    renderCell: (p) => <DepartmentCell row={p.row as any} value={p.value as any} patchKind="employee" />,
  },
  {
    field: "position",
    headerName: "Должность",
    width: 180,
    sortable: false,
    renderCell: (p) => <PositionCell row={p.row as any} value={p.value as any} patchKind="employee" />,
  },
  {
    field: "birthdayAt",
    headerName: "ДР",
    width: 150,
    sortable: false,
    renderCell: (p) => <EmployeeBirthdayCell row={p.row as any} />,
  },
  { field: "hiredAtText", headerName: "Принят", width: 140 },
  { field: "notes", headerName: "Заметки", flex: 1, minWidth: 220, editable: true },
];

export default employeesColumns;