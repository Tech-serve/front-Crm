import type { GridColDef, GridPreProcessEditCellProps } from "@mui/x-data-grid";
import { HR_STATUS_OPTIONS } from "src/config/statusConfig";

import StatusCell from "src/tables/cells/StatusCell";
import DepartmentCell from "./cells/DepartmentCell";
import PositionCell from "./cells/PositionCell";
import WhenCell from "src/tables/cells/WhenCell";
import MidCell from "./cells/MeetCell";
import DeleteCandidateCell from "src/tables/cells/DeleteCandidateCell";

const phonePreprocess = (params: GridPreProcessEditCellProps) => {
  const v = String(params.props.value ?? "").trim();
  const ok = v.length === 0 || /^[+()\d\s-]{5,}$/.test(v);
  return { ...params.props, value: v, error: !ok };
};

const emailPreprocess = (params: GridPreProcessEditCellProps) => {
  const v = String(params.props.value ?? "").trim();
  const error = v.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  return { ...params.props, value: v, error };
};

const candidatesColumns: GridColDef[] = [
  { field: "fullName", headerName: "Кандидат", flex: 1, minWidth: 160, editable: true },

  {
    field: "phone",
    headerName: "Телефон",
    width: 160,
    editable: true,
    preProcessEditCellProps: phonePreprocess,
  },
  {
    field: "email",
    headerName: "Email",
    width: 200,
    editable: true,
    preProcessEditCellProps: emailPreprocess,
  },

  {
    field: "scheduledAtText",
    headerName: "Когда",
    width: 110,
    sortable: false,
    renderCell: (p) => <WhenCell row={p.row as any} />,
  },
  {
    field: "statusLabel",
    headerName: "Статус",
    width: 245,
    sortable: false,
    renderCell: (p) => (
      <StatusCell
        row={p.row as any}
        value={(p.row as any).statusCode}
        options={HR_STATUS_OPTIONS}
      />
    ),
  },

  {
    field: "department",
    headerName: "Отдел",
    width: 180,
    sortable: false,
    renderCell: (p) => <DepartmentCell row={p.row as any} value={p.value as any} />,
  },
  {
    field: "position",
    headerName: "Position",
    width: 180,
    sortable: false,
    renderCell: (p) => <PositionCell row={p.row as any} value={p.value as any} />,
  },

  {
    field: "meetLink",
    headerName: "Google Meet",
    width: 400,
    sortable: false,
    renderCell: (p) => <MidCell row={p.row as any} url={p.value as string | undefined} />,
  },

  { field: "notes", headerName: "Заметки", flex: 1, minWidth: 260, editable: true },

  {
    field: "__del",
    headerName: "",
    width: 56,
    sortable: false,
    filterable: false,
    align: "center",
    headerAlign: "center",
    cellClassName: "dg-center",
    disableColumnMenu: true,
    renderCell: (p) => <DeleteCandidateCell id={(p.row as any)._id} />,
  },
];

export default candidatesColumns;