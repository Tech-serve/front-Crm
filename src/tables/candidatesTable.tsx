import type { GridColDef } from "@mui/x-data-grid";
import StatusCell from "src/tables/cells/StatusCell";
import { HR_STATUS_OPTIONS } from "src/config/statusConfig";
import type { Candidate, InterviewStatus } from "src/types/domain";

function LinkCell({ url }: { url?: string }) {
  if (!url) return <span style={{ color: "#94a3b8" }}>—</span>;
  return <a href={url} target="_blank" rel="noopener noreferrer" title={url}
           style={{ color: "#1a73e8", textDecoration: "none", maxWidth: "100%", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{url}</a>;
}

const candidatesColumns: GridColDef[] = [
  { field: "fullName",  headerName: "Кандидат",   flex: 1, minWidth: 160 },
  { field: "email",     headerName: "Email",      width: 200 },

  /* данные первого (актуального) интервью в массиве */
  { field: "scheduledAtText", headerName: "Когда",      width: 220 },
  {
    field: "status",
    headerName: "Статус",
    width: 200,
    sortable: false,
    renderCell: (p) => (
      <StatusCell
        row={p.row as Candidate}
        value={p.value as InterviewStatus}
        options={HR_STATUS_OPTIONS}
        /* если нужно — onChange с мутацией patchCandidate */
      />
    ),
  },
  {
    field: "meetLink",
    headerName: "Meet",
    width: 280,
    sortable: false,
    renderCell: (p) => <LinkCell url={p.value as string | undefined} />,
  },
  { field: "notes", headerName: "Заметки", flex: 1, minWidth: 200, editable: true },
];

export default candidatesColumns;