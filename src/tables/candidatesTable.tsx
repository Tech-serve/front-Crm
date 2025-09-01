// frontend/src/tables/candidatesTable.tsx
import type { GridColDef } from "@mui/x-data-grid";
import { HR_STATUS_OPTIONS } from "src/config/statusConfig";
import type { Candidate, InterviewStatus } from "src/types/domain";
import StatusCell from "src/tables/cells/StatusCell";
import DepartmentCell from "./cells/DepartmentCell";
import PositionCell from "./cells/PositionCell";
import WhenCell from "src/tables/cells/WhenCell";
import MidCell from "./cells/MeetCell";

// 👇 добавлено для удаления
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useDeleteCandidateMutation } from "src/api/candidatesApi";

function DeleteCandidateCell({ id }: { id: string }) {
  const [del] = useDeleteCandidateMutation();
  return (
    <Tooltip title="Удалить кандидата">
      <IconButton
        size="small"
        color="error"
        onClick={() => {
          if (confirm("Удалить кандидата без возможности восстановления?")) {
            del(id);
          }
        }}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

const LinkCell = ({ url }: { url?: string }) =>
  url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "#1a73e8",
        textDecoration: "none",
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontWeight: 500,
      }}
    >
      {url}
    </a>
  ) : (
    <span style={{ color: "#94a3b8" }}>—</span>
  );

const candidatesColumns: GridColDef[] = [
  { field: "fullName", headerName: "Кандидат", flex: 1, minWidth: 160, editable: true },
  {
    field: "phone",
    headerName: "Телефон",
    width: 160,
    editable: true,
    preProcessEditCellProps: (params) => {
      const v = String(params.props.value ?? "").trim();
      const ok = v.length === 0 || /^[+()\d\s-]{5,}$/.test(v);
      return { ...params.props, value: v, error: !ok };
    },
  },
  {
    field: "email",
    headerName: "Email",
    width: 200,
    editable: true,
    preProcessEditCellProps: (params) => {
      const v = String(params.props.value ?? "").trim();
      const error = v.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      return { ...params.props, value: v, error };
    },
  },
  {
    field: "scheduledAtText",
    headerName: "Когда",
    width: 220,
    sortable: false,
    renderCell: (p) => <WhenCell row={p.row as Candidate} />,
  },
  {
    field: "statusLabel",
    headerName: "Статус",
    width: 250,
    sortable: false,
    renderCell: (p) => (
      <StatusCell
        row={p.row as Candidate}
        value={p.row.statusCode as InterviewStatus}
        options={HR_STATUS_OPTIONS}
      />
    ),
  },
  {
    field: "department",
    headerName: "Отдел",
    width: 180,
    sortable: false,
    renderCell: (p) => <DepartmentCell row={p.row as Candidate} value={p.value as any} />,
  },
  {
    field: "position",
    headerName: "Position",
    width: 180,
    sortable: false,
    renderCell: (p) => <PositionCell row={p.row as Candidate} value={p.value as any} />,
  },
  {
    field: "meetLink",
    headerName: "Google meet",
    width: 400,
    sortable: false,
    renderCell: (p) => <MidCell row={p.row as Candidate} url={p.value as string | undefined} />,
  },
  {
    field: "notes",
    headerName: "Заметки",
    flex: 1,
    minWidth: 200,
    editable: true,
  },
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