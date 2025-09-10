import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  TextField,
  Typography,
  Stack,
  IconButton,
} from "@mui/material";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";

import { useGetCandidatesQuery } from "src/api/candidatesApi";
import { useGetEmployeesQuery } from "src/api/employeesApi";
import candidatesColumns from "src/tables/candidatesTable";
import employeesColumns from "src/tables/employeesTable";

type ViewKind = "candidates" | "employees";

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function matchesQueryCandidate(row: any, q: string) {
  const needle = norm(q);
  if (!needle) return true;
  const fields = [
    row.fullName,
    row.email,
    row.phone,
    row.department,
    row.position,
    row.notes,
    row.status,
    row.meetLink,
  ];
  const dateFields = [row.createdAt, row.acceptedAt, row.declinedAt, row.canceledAt, row.polygraphAt]
    .map((d) => (d ? dayjs(d).format("DD.MM.YYYY HH:mm") : ""));
  return [...fields, ...dateFields].some((v) => norm(v).includes(needle));
}

function matchesQueryEmployee(row: any, q: string) {
  const needle = norm(q);
  if (!needle) return true;
  const fields = [
    row.fullName,
    row.email,
    row.phone,
    row.department,
    row.position,
    row.notes,
  ];
  const dateFields = [row.hiredAt, row.terminatedAt, row.birthdayAt]
    .map((d) => (d ? dayjs(d).format("DD.MM.YYYY") : ""));
  return [...fields, ...dateFields].some((v) => norm(v).includes(needle));
}

export default function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const qParam = sp.get("q") ?? "";
  const [query, setQuery] = useState(qParam);
  const [active, setActive] = useState<ViewKind>("candidates");

  const { data: candPage, isLoading: candLoading } = useGetCandidatesQuery({ page: 1, pageSize: 2000 });
  const { data: empPage,  isLoading: empLoading }  = useGetEmployeesQuery({ page: 1, pageSize: 2000 } as any);

  const candidates = useMemo(() => (candPage?.items ?? []).map((c: any) => ({ ...c, id: c._id })), [candPage?.items]);
  const employees  = useMemo(() => (empPage?.items  ?? []).map((e: any) => ({ ...e, id: e._id })),  [empPage?.items]);

  const candFiltered = useMemo(() => candidates.filter((c) => matchesQueryCandidate(c, query)), [candidates, query]);
  const empFiltered  = useMemo(() => employees.filter((e) => matchesQueryEmployee(e, query)),   [employees, query]);

  const candCount = candFiltered.length;
  const empCount  = empFiltered.length;

  useEffect(() => {
    if (!query.trim()) return;
    if (candCount > 0 && empCount === 0) setActive("candidates");
    else if (empCount > 0 && candCount === 0) setActive("employees");
  }, [query, candCount, empCount]);

  useEffect(() => {
    const next = new URLSearchParams(sp);
    if (query) next.set("q", query);
    else next.delete("q");
    if (next.toString() !== sp.toString()) setSp(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const loading = candLoading || empLoading;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>Поиск по CRM</Typography>

      <Card sx={{ mb: 1.5 }}>
        <CardContent sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            fullWidth
            size="small"
            label="Что ищем? (ФИО, email, телефон, отдел, должность…) "
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              endAdornment: query ? (
                <IconButton size="small" onClick={() => setQuery("")}>
                  <ClearRoundedIcon fontSize="small" />
                </IconButton>
              ) : null,
            }}
          />
          <Stack direction="row" spacing={1}>
            <Chip
              label={`Кандидаты: ${candCount}`}
              color={active === "candidates" ? "primary" : "default"}
              variant={active === "candidates" ? "filled" : "outlined"}
              onClick={() => setActive("candidates")}
            />
            <Chip
              label={`Сотрудники: ${empCount}`}
              color={active === "employees" ? "primary" : "default"}
              variant={active === "employees" ? "filled" : "outlined"}
              onClick={() => setActive("employees")}
            />
          </Stack>
        </CardContent>
      </Card>

      {(!query.trim()) && (
        <Card>
          <CardContent>
            <Typography color="text.secondary">
              Введите запрос выше — и здесь появится соответствующая таблица («Кандидаты» или «Сотрудники») только с найденными строками.
            </Typography>
          </CardContent>
        </Card>
      )}

      {query.trim() && (
        <Card sx={{ flex: 1, minHeight: 0 }}>
          <CardContent sx={{ p: 1.5, height: "100%" }}>
            {(candCount > 0 && empCount > 0) && (
              <Tabs value={active} onChange={(_, v) => setActive(v)} sx={{ mb: 1 }}>
                <Tab value="candidates" label={`Кандидаты (${candCount})`} />
                <Tab value="employees"  label={`Сотрудники (${empCount})`} />
              </Tabs>
            )}

            <Box sx={{ height: "100%", width: "100%" }}>
              {active === "candidates" ? (
                <DataGrid
                  rows={candFiltered}
                  columns={candidatesColumns as any}
                  loading={loading}
                  getRowId={(r) => (r as any)._id}
                  disableRowSelectionOnClick
                  sx={gridSx}
                />
              ) : (
                <DataGrid
                  rows={empFiltered}
                  columns={employeesColumns as any}
                  loading={loading}
                  getRowId={(r) => (r as any)._id}
                  disableRowSelectionOnClick
                  sx={gridSx}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

const gridSx = {
  height: "100%",
  width: "100%",
  border: 0,
  "& .MuiDataGrid-main": { height: "100%" },
  "& .MuiDataGrid-virtualScroller": {
    overflowY: "auto",
    paddingBottom: { xs: 1, md: 0 },
  },
  "& .MuiDataGrid-columnHeaders": { borderRadius: { xs: 1, md: 2 } },
  "& .dg-center": { justifyContent: "center !important", px: 0 },
  "& .dg-center .MuiDataGrid-cellContent": { display: "flex", justifyContent: "center", width: "100%", overflow: "visible" },
  "& .dg-vcenter": { py: 0, alignItems: "center !important", display: "flex" },
  "& .dg-vcenter .MuiDataGrid-cellContent": { display: "flex", alignItems: "center", height: "100%" },
  "& .dg-vcenter .MuiFormControl-root": { margin: 0 },
  "& .dg-vcenter .MuiInputBase-root": { height: 36, alignItems: "center" },
  "& .dg-vcenter input": { textAlign: "center", paddingTop: 0, paddingBottom: 0 },
} as const;