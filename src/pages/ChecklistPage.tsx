// src/pages/ChecklistPage.tsx
import { useMemo } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import dayjs from "dayjs";

import { useGetCandidatesQuery } from "src/api/candidatesApi";
import type { Candidate, Interview } from "src/types/domain";

type ChecklistRow = {
  id: string;
  candidateId: string;
  fullName: string;
  whenISO: string | null;
  type: "meet" | "polygraph";
  link?: string | null;
  address?: string | null;
};

const formatWhenVal = (value: unknown): string =>
  value ? dayjs(String(value)).format("DD.MM.YYYY HH:mm") : "—";

const byISO = (a: unknown, b: unknown): number =>
  String(a ?? "").localeCompare(String(b ?? ""));

export default function ChecklistPage() {
  const { data } = useGetCandidatesQuery({ page: 1, pageSize: 1000 });
  const candidates = (data?.items ?? []) as Candidate[];

  const { meetRows, polyRows } = useMemo(() => {
    const meets: ChecklistRow[] = [];
    const polys: ChecklistRow[] = [];

    const nowTs = Date.now();

    for (const c of candidates) {
      const fullName = c.fullName ?? "";
      const cid = String(c._id ?? "");

      const ivs: Interview[] = Array.isArray(c.interviews) ? (c.interviews as any) : [];
      let chosenMeet: Interview | undefined;
      let chosenTs = Number.POSITIVE_INFINITY;

      for (const iv of ivs) {
        const ts = iv?.scheduledAt ? Date.parse(String(iv.scheduledAt)) : NaN;
        if (!Number.isNaN(ts) && ts > nowTs && ts < chosenTs) {
          chosenTs = ts;
          chosenMeet = iv;
        }
      }

      if (chosenMeet) {
        const meetWhen = String(chosenMeet.scheduledAt);
        const meetLink = (chosenMeet.meetLink ?? (c as any).meetLink) || null;

        meets.push({
          id: `meet:${cid}:${meetWhen}`,
          candidateId: cid,
          fullName,
          whenISO: meetWhen,
          type: "meet",
          link: meetLink,
        });
      }

      const isCurrentPoly = c.status === "reserve";
      const polyWhen = isCurrentPoly && c.polygraphAt ? String(c.polygraphAt) : null;
      const polyAddr = isCurrentPoly ? ((c as any).polygraphAddress ?? null) : null;

      if (polyWhen) {
        polys.push({
          id: `poly:${cid}:${polyWhen}`,
          candidateId: cid,
          fullName,
          whenISO: polyWhen,
          type: "polygraph",
          address: polyAddr,
        });
      }
    }

    meets.sort((a, b) => byISO(a.whenISO, b.whenISO));
    polys.sort((a, b) => byISO(a.whenISO, b.whenISO));

    return { meetRows: meets, polyRows: polys };
  }, [candidates]);

  const meetCols: Array<GridColDef<ChecklistRow>> = [
    { field: "fullName", headerName: "Кандидат", flex: 1, minWidth: 180 },
    {
      field: "whenISO",
      headerName: "Время",
      flex: 0.7,
      minWidth: 150,
      valueFormatter: (value: any) => formatWhenVal(value),
      sortComparator: (a: any, b: any) => byISO(a, b),
    },
    {
      field: "link",
      headerName: "Google Meet",
      flex: 0.9,
      minWidth: 220,
      renderCell: (params: any) => {
        const v = params.value as string | null;
        return v ? (
          <a href={v} target="_blank" rel="noreferrer">
            {v}
          </a>
        ) : (
          "—"
        );
      },
    },
  ];

  const polyCols: Array<GridColDef<ChecklistRow>> = [
    { field: "fullName", headerName: "Кандидат", flex: 1, minWidth: 180 },
    {
      field: "whenISO",
      headerName: "Время",
      flex: 0.7,
      minWidth: 150,
      valueFormatter: (value: any) => formatWhenVal(value),
      sortComparator: (a: any, b: any) => byISO(a, b),
    },
    { field: "address", headerName: "Адрес полиграфа", flex: 1, minWidth: 240 },
  ];

  return (
    <Box sx={{
      px: { xs: 0, md: 3 },      
      pt: { xs: 0, md: 3 },      
      pb: { xs: 2, md: 3 },
      display: "grid",
      gap: 2,
    }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Google Meet (только предстоящие)</Typography>
          <div style={{ height: 420, width: "100%" }}>
            <DataGrid
              rows={meetRows}
              columns={meetCols}
              getRowId={(r) => r.id}
              disableRowSelectionOnClick
              initialState={{
                sorting: { sortModel: [{ field: "whenISO", sort: "asc" }] },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Полиграфы (текущие)</Typography>
          <div style={{ height: 420, width: "100%" }}>
            <DataGrid
              rows={polyRows}
              columns={polyCols}
              getRowId={(r) => r.id}
              disableRowSelectionOnClick
              initialState={{
                sorting: { sortModel: [{ field: "whenISO", sort: "asc" }] },
              }}
            />
          </div>
        </CardContent>
      </Card>
    </Box>
  );
}