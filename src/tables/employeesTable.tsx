import type { GridColDef, GridPreProcessEditCellProps } from "@mui/x-data-grid";
import DepartmentCell from "src/tables/cells/DepartmentCell";
import PositionCell from "src/tables/cells/PositionCell";
import EmployeeBirthdayCell from "src/tables/cells/EmployeeBirthdayCell";
import EmployeeHiredAtCell from "./cells/EmployeeHiredAtCell";
import EmployeeTerminatedCell from "./cells/EmployeeTerminatedCell";

const emailPreprocess = (params: GridPreProcessEditCellProps) => ({
  ...params.props,
  error: !!params.props.value &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(params.props.value).trim()),
});

const phonePreprocess = (params: GridPreProcessEditCellProps) => ({
  ...params.props,
  error: !!params.props.value &&
    !/^[\d\s()+-]{5,}$/.test(String(params.props.value).trim()),
});

const employeesColumns: GridColDef[] = [
  { field: "fullName", headerName: "Сотрудник", flex: 1, minWidth: 180, editable: true },

  { field: "email", headerName: "Email", width: 240, editable: true, preProcessEditCellProps: emailPreprocess },
  { field: "phone", headerName: "Телефон", width: 180, editable: true, preProcessEditCellProps: phonePreprocess },

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
    field: "hiredAt",
    headerName: "Принят",
    width: 220,
    sortable: false,
    renderCell: (p) => <EmployeeHiredAtCell row={p.row as any} />,
  },

  {
    field: "terminatedAt",
    headerName: "Уволен",
    width: 220,
    sortable: false,
    renderCell: (p) => <EmployeeTerminatedCell row={p.row as any} />,
  },
  {
    field: "birthdayAt",
    headerName: "ДР",
    width: 160,
    sortable: false,
    align: "center",
    headerAlign: "center",
    cellClassName: "dg-center dg-vcenter",
    renderCell: (p) => <EmployeeBirthdayCell row={p.row as any} />,
  },
  { field: "notes", headerName: "Заметки", flex: 1, minWidth: 220, editable: true },
];

export default employeesColumns;