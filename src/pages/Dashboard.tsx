// src/pages/Dashboard.tsx
import { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  MenuItem,
  Select,
  styled,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import dayjs, { Dayjs } from "dayjs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { useGetCandidatesQuery } from "src/api/candidatesApi";
import type { Candidate } from "src/types/domain";
import { DEPARTMENTS } from "src/config/departmentConfig";
import { POSITION_OPTIONS } from "src/config/positionConfig";

/* ===== стили селектов как в таблицах ===== */
const WIDTH = 160;
const CompactSelect = styled(Select)(({ theme }) => ({
  "& .MuiSelect-select": {
    padding: "6px 10px",
    minHeight: 32,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    boxSizing: "border-box",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderRadius: theme.shape.borderRadius,
  },
}));
const Dot = ({ color }: { color: string }) => (
  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color }} />
);

/* ===== цвета/лейблы статусов ===== */
const COLORS = {
  not_held: "#3498db",   // В процессе (считаем только в месяц создания)
  reserve:  "#f4a261",   // Полиграф
  success:  "#2ecc71",   // Принято
  declined: "#ff6b6b",   // Отказано
  canceled: "#95a5a6",   // Отказался
} as const;

const LABEL = {
  not_held: "В процессе",
  reserve:  "Полиграф",
  success:  "Принято",
  declined: "Отказано",
  canceled: "Отказался",
} as const;

type BucketKey = keyof typeof LABEL;
type SnapshotRow = { month: string } & Record<BucketKey, number>;
type EventRow = { month: string; polygraph: number; accepted: number; declined: number; canceled: number };

const YM = (d: Dayjs) => d.format("YYYY-MM");

function isSameMonth(a: Dayjs, b: Dayjs) {
  return a.year() === b.year() && a.month() === b.month();
}
function isSameOrBeforeMonth(a: Dayjs, b: Dayjs) {
  return a.year() < b.year() || (a.year() === b.year() && a.month() <= b.month());
}
function isBetweenInclusive(d: unknown, start: Dayjs, end: Dayjs) {
  if (!d) return false;
  const v = dayjs(d as string);
  if (!v.isValid()) return false;
  return v.isAfter(start.subtract(1, "second")) && v.isBefore(end.add(1, "second"));
}

export default function Dashboard() {
  const now = dayjs();
  const nowMonth = now.startOf("month");
  const [month, setMonth] = useState<Dayjs>(nowMonth);

  // данные
  const { data: page } = useGetCandidatesQuery({ page: 1, pageSize: 1000 });
  const candidates = useMemo(() => ((page?.items as Candidate[]) ?? []), [page?.items]);

  /* ===== фильтры: Отдел + Должность (визуально как в ячейке) ===== */
  const [department, setDepartment] = useState<string>("all");
  const [position, setPosition] = useState<string>("all");

  const deptOptions = useMemo(
    () =>
      (DEPARTMENTS as readonly any[]).map((d) => ({
        value: typeof d === "string" ? d : d?.value ?? String(d?.label ?? ""),
        label: typeof d === "string" ? d : d?.label ?? String(d?.value ?? ""),
        bg:    (d as any).bg ?? "#EAF2FF",
        fg:    (d as any).fg ?? "#0f1b2a",
        dot:   (d as any).dot ?? "#9aa4af",
      })),
    []
  );

  const posOptions = useMemo(() => {
    if (department === "all") return Object.values(POSITION_OPTIONS).flat();
    return POSITION_OPTIONS[department] ?? [];
  }, [department]);

  const filteredCandidates = useMemo(() => {
    const dep = department.toLowerCase();
    const pos = position.toLowerCase();
    return candidates.filter((c) => {
      const depOk =
        department === "all" ||
        String((c as any).department ?? "").toLowerCase() === dep;
      const posOk =
        position === "all" ||
        String((c as any).position ?? "").toLowerCase() === pos;
      return depOk && posOk;
    });
  }, [candidates, department, position]);

  /* ===== KPI «статус на период» (event-based) ===== */
  const periodCounts = useMemo(() => {
    const start = month.startOf("month");
    const end = month.endOf("month");
    const res: Record<BucketKey, number> = { not_held: 0, reserve: 0, success: 0, declined: 0, canceled: 0 };

    for (const c of filteredCandidates) {
      if (isBetweenInclusive((c as any).acceptedAt, start, end))  { res.success  += 1; continue; }
      if (isBetweenInclusive((c as any).declinedAt, start, end))  { res.declined += 1; continue; }
      if (isBetweenInclusive((c as any).canceledAt, start, end))  { res.canceled += 1; continue; }
      if (isBetweenInclusive((c as any).polygraphAt, start, end)) { res.reserve  += 1; continue; }
      // «В процессе» — ТОЛЬКО если создан в этом месяце
      if (isBetweenInclusive((c as any).createdAt, start, end))   { res.not_held += 1; }
    }
    return res;
  }, [filteredCandidates, month]);

  /* ===== Снимок по месяцам (фикс «В процессе» тянется по всем месяцам) ===== */
  const snapshotBars = useMemo((): SnapshotRow[] => {
    const start = dayjs().startOf("year");
    const months: Dayjs[] = [];
    for (let cur = start; isSameOrBeforeMonth(cur, nowMonth); cur = cur.add(1, "month")) {
      months.push(cur);
    }

    return months.map((m) => {
      const mStart = m.startOf("month");
      const mEnd   = m.endOf("month");
      const row: SnapshotRow = { month: YM(m), not_held: 0, reserve: 0, success: 0, declined: 0, canceled: 0 };

      for (const c of filteredCandidates) {
        // считаем по событиям именно ЭТОГО месяца:
        if (isBetweenInclusive((c as any).acceptedAt,  mStart, mEnd)) { row.success  += 1; continue; }
        if (isBetweenInclusive((c as any).declinedAt,  mStart, mEnd)) { row.declined += 1; continue; }
        if (isBetweenInclusive((c as any).canceledAt,  mStart, mEnd)) { row.canceled += 1; continue; }
        if (isBetweenInclusive((c as any).polygraphAt, mStart, mEnd)) { row.reserve  += 1; continue; }
        // В ПРОЦЕССЕ — только месяц создания
        if (isBetweenInclusive((c as any).createdAt,   mStart, mEnd)) { row.not_held += 1; }
      }

      return row;
    });
  }, [filteredCandidates, nowMonth]);

  /* ===== «События по месяцам» как было ===== */
  const eventBars = useMemo((): EventRow[] => {
    const map = new Map<string, EventRow>();

    for (const p of filteredCandidates) {
      if ((p as any).polygraphAt) addEvent(map, YM(dayjs((p as any).polygraphAt)), "polygraph");
      if ((p as any).acceptedAt)  addEvent(map, YM(dayjs((p as any).acceptedAt)),  "accepted");
      if ((p as any).declinedAt)  addEvent(map, YM(dayjs((p as any).declinedAt)),  "declined");
      if ((p as any).canceledAt)  addEvent(map, YM(dayjs((p as any).canceledAt)),  "canceled");
    }

    const start = dayjs().startOf("year");
    for (let cur = start; isSameOrBeforeMonth(cur, nowMonth); cur = cur.add(1, "month")) {
      const key = YM(cur);
      if (!map.has(key)) {
        map.set(key, { month: key, polygraph: 0, accepted: 0, declined: 0, canceled: 0 });
      }
    }

    return Array.from(map.values())
      .filter((r) => isSameOrBeforeMonth(dayjs(r.month + "-01"), nowMonth))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredCandidates, nowMonth]);

  const prevMonth = () => setMonth((m) => m.subtract(1, "month"));
  const nextMonth = () => setMonth((m) => (isSameMonth(m, nowMonth) ? m : m.add(1, "month")));

  /* ===== Render ===== */
  const currentDept = useMemo(() => {
    if (department === "all") return { value: "all", label: "Все", bg: "#EFF4FF", fg: "#0f1b2a", dot: "#9aa4af" };
    return (
      deptOptions.find((d) => d.value === department) ??
      { value: department, label: department, bg: "#EFF4FF", fg: "#0f1b2a", dot: "#9aa4af" }
    );
  }, [department, deptOptions]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Шапка: ровно такие же селекты, как в таблицах */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 12, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" sx={{ mr: "auto" }}>Дашборд кандидатов</Typography>

        {/* Отдел */}
        <Box sx={{ display: "grid", gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Отдел</Typography>
          <CompactSelect
            size="small"
            value={department}
            onChange={(e) => { setDepartment(String(e.target.value)); setPosition("all"); }}
            sx={{
              width: WIDTH,
              bgcolor: currentDept.bg,
              color: currentDept.fg,
              "& .MuiSvgIcon-root": { color: currentDept.fg },
            }}
            MenuProps={{ PaperProps: { sx: { mt: 0.5 } } }}
          >
            <MenuItem value="all">
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                <Dot color="#9aa4af" /> Все
              </Box>
            </MenuItem>
            {deptOptions.map((d) => (
              <MenuItem key={d.value} value={d.value}>
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                  <Dot color={d.dot} /> {d.label}
                </Box>
              </MenuItem>
            ))}
          </CompactSelect>
        </Box>

        {/* Должность */}
        <Box sx={{ display: "grid", gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Должность</Typography>
          <CompactSelect
            size="small"
            value={position}
            onChange={(e) => setPosition(String(e.target.value))}
            sx={{
              width: WIDTH,
              bgcolor: "#EAF7FF",
              color: "#0f1b2a",
              "& .MuiSvgIcon-root": { color: "#0f1b2a" },
            }}
            MenuProps={{ PaperProps: { sx: { mt: 0.5 } } }}
          >
            <MenuItem value="all">Все</MenuItem>
            {posOptions.map((p: any) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </CompactSelect>
        </Box>

        {/* Период */}
        <Box sx={{ display: "grid", gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Период</Typography>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={prevMonth}><ChevronLeftRoundedIcon /></IconButton>
            <Chip label={month.format("MM.YYYY")} />
            <IconButton size="small" onClick={nextMonth}><ChevronRightRoundedIcon /></IconButton>
            <Chip
              label="Сейчас"
              color={isSameMonth(month, nowMonth) ? "primary" : "default"}
              onClick={() => setMonth(nowMonth)}
            />
          </Box>
        </Box>
      </Box>

      {/* KPI */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Статус на период</Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", md: "repeat(5,1fr)" },
              gap: 2,
            }}
          >
            {[
              { key: "not_held" as const, color: COLORS.not_held, label: LABEL.not_held, value: periodCounts.not_held },
              { key: "reserve"  as const, color: COLORS.reserve,  label: LABEL.reserve,  value: periodCounts.reserve },
              { key: "success"  as const, color: COLORS.success,  label: LABEL.success,  value: periodCounts.success },
              { key: "declined" as const, color: COLORS.declined, label: LABEL.declined, value: periodCounts.declined },
              { key: "canceled" as const, color: COLORS.canceled, label: LABEL.canceled, value: periodCounts.canceled },
            ].map((k) => (
              <Card key={k.key} variant="outlined" sx={{ borderTop: `3px solid ${k.color}` }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">{k.label}</Typography>
                  <Typography variant="h5">{k.value}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Снимок по месяцам */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" mb={2}>Снимок статусов по месяцам</Typography>
          <Box sx={{ width: "100%", height: 340 }}>
            <ResponsiveContainer>
              <BarChart data={snapshotBars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="not_held" name={LABEL.not_held} stackId="s" fill={COLORS.not_held} />
                <Bar dataKey="reserve"  name={LABEL.reserve}  stackId="s" fill={COLORS.reserve} />
                <Bar dataKey="success"  name={LABEL.success}  stackId="s" fill={COLORS.success} />
                <Bar dataKey="declined" name={LABEL.declined} stackId="s" fill={COLORS.declined} />
                <Bar dataKey="canceled" name={LABEL.canceled} stackId="s" fill={COLORS.canceled} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            «В процессе» считается только в месяце создания кандидата.
          </Typography>
        </CardContent>
      </Card>

      {/* События по месяцам (оставил как у тебя) */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" mb={2}>События по месяцам</Typography>
          <Box sx={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={eventBars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="polygraph" name="Полиграф"  fill={COLORS.reserve} />
                <Bar dataKey="accepted"  name="Принято"   fill={COLORS.success} />
                <Bar dataKey="declined"  name="Отказано"  fill={COLORS.declined} />
                <Bar dataKey="canceled"  name="Отказался" fill={COLORS.canceled} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

/* ===== helpers для нижнего графика ===== */
function addEvent(
  map: Map<string, EventRow>,
  month: string,
  key: keyof Omit<EventRow, "month">
) {
  if (!map.has(month)) {
    map.set(month, { month, polygraph: 0, accepted: 0, declined: 0, canceled: 0 });
  }
  const row = map.get(month)!;
  row[key] += 1;
}