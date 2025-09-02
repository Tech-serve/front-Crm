// src/pages/Dashboard.tsx
import { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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

// ---- Цвета/лейблы (как было) ----
const COLORS = {
  not_held: "#3498db",   // В процессе
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
const endOfMonth = (d: Dayjs) => d.endOf("month");

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

// «Снимок на конец месяца» по датам событий
function classifyAt(c: Candidate, cutoff: Dayjs): BucketKey {
  if (isBetweenInclusive((c as any).acceptedAt, dayjs("1970-01-01"), cutoff)) return "success";
  if (isBetweenInclusive((c as any).declinedAt, dayjs("1970-01-01"), cutoff)) return "declined";
  if (isBetweenInclusive((c as any).canceledAt, dayjs("1970-01-01"), cutoff)) return "canceled";
  if (isBetweenInclusive((c as any).polygraphAt, dayjs("1970-01-01"), cutoff)) return "reserve";
  return "not_held";
}

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

export default function Dashboard() {
  const now = dayjs();
  const nowMonth = now.startOf("month");
  const [month, setMonth] = useState<Dayjs>(nowMonth);

  // данные кандидатов
  const { data: page } = useGetCandidatesQuery({ page: 1, pageSize: 1000 });

  // FIX exhaustive-deps: стабильный массив кандидатов
  const candidates = useMemo(
    () => ((page?.items as Candidate[]) ?? []),
    [page?.items]
  );

  // --- СЕЛЕКТЫ: Отдел и Должность (как в таблицах) ---
  const [department, setDepartment] = useState<string>("all");
  const [position, setPosition] = useState<string>("all");

  // DEPARTMENTS может быть readonly/разных форм — приводим к {value,label}
  const deptOptions = useMemo(
    () =>
      (DEPARTMENTS as readonly any[]).map((d) => ({
        value: typeof d === "string" ? d : d?.value ?? String(d?.label ?? ""),
        label: typeof d === "string" ? d : d?.label ?? String(d?.value ?? ""),
      })),
    []
  );

  // POSITION_OPTIONS — это Record<department, Array<{value,label}>>
  const posOptions = useMemo(() => {
    if (department === "all") {
      return Object.values(POSITION_OPTIONS).flat();
    }
    return POSITION_OPTIONS[department] ?? [];
  }, [department]);

  // фильтрация по отделу/должности — всё дальше считает только по отфильтрованным
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

  // ---- Плашка «Статус на период» ----
  const periodCounts = useMemo(() => {
    const start = month.startOf("month");
    const end = month.endOf("month");
    const res: Record<BucketKey, number> = { not_held: 0, reserve: 0, success: 0, declined: 0, canceled: 0 };

    for (const c of filteredCandidates) {
      if (isBetweenInclusive((c as any).acceptedAt, start, end))  { res.success  += 1; continue; }
      if (isBetweenInclusive((c as any).declinedAt, start, end))  { res.declined += 1; continue; }
      if (isBetweenInclusive((c as any).canceledAt, start, end))  { res.canceled += 1; continue; }
      if (isBetweenInclusive((c as any).polygraphAt, start, end)) { res.reserve  += 1; continue; }
      if (isBetweenInclusive((c as any).createdAt, start, end))   { res.not_held += 1; }
    }
    return res;
  }, [filteredCandidates, month]);

  // ---- «Снимок статусов на конец месяца» ----
  const snapshotBars = useMemo((): SnapshotRow[] => {
    const start = dayjs().startOf("year");
    const months: Dayjs[] = [];
    for (let cur = start; isSameOrBeforeMonth(cur, nowMonth); cur = cur.add(1, "month")) {
      months.push(cur);
    }

    return months.map((m) => {
      const cutoff = endOfMonth(m);
      const row: SnapshotRow = { month: YM(m), not_held: 0, reserve: 0, success: 0, declined: 0, canceled: 0 };
      for (const c of filteredCandidates) {
        const key = classifyAt(c, cutoff);
        row[key] += 1;
      }
      return row;
    });
  }, [filteredCandidates, nowMonth]);

  // ---- «События по месяцам» ----
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

  const kpis = [
    { key: "not_held" as const, label: LABEL.not_held, value: periodCounts.not_held },
    { key: "reserve"  as const, label: LABEL.reserve,  value: periodCounts.reserve },
    { key: "success"  as const, label: LABEL.success,  value: periodCounts.success },
    { key: "declined" as const, label: LABEL.declined, value: periodCounts.declined },
    { key: "canceled" as const, label: LABEL.canceled, value: periodCounts.canceled },
  ];

  const prevMonth = () => setMonth((m) => m.subtract(1, "month"));
  const nextMonth = () => setMonth((m) => (isSameMonth(m, nowMonth) ? m : m.add(1, "month")));

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Шапка: добавлены селекты Отдел/Должность, кнопки обновить нет */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" sx={{ mr: "auto" }}>Дашборд кандидатов</Typography>
        <Typography variant="body2" color="text.secondary">
          Диапазон: {dayjs().startOf("year").format("DD.MM.YYYY")} — {dayjs().endOf("month").format("DD.MM.YYYY")}
        </Typography>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="dep-select-lbl">Отдел</InputLabel>
          <Select
            labelId="dep-select-lbl"
            label="Отдел"
            value={department}
            onChange={(e) => { setDepartment(String(e.target.value)); setPosition("all"); }}
          >
            <MenuItem value="all">Все</MenuItem>
            {deptOptions.map((d) => (
              <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="pos-select-lbl">Должность</InputLabel>
          <Select
            labelId="pos-select-lbl"
            label="Должность"
            value={position}
            onChange={(e) => setPosition(String(e.target.value))}
          >
            <MenuItem value="all">Все</MenuItem>
            {posOptions.map((p) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mr: "auto" }}>Статус на период</Typography>
            <IconButton size="small" onClick={prevMonth}><ChevronLeftRoundedIcon /></IconButton>
            <Chip label={month.format("MM.YYYY")} />
            <IconButton size="small" onClick={nextMonth}><ChevronRightRoundedIcon /></IconButton>
            <Chip
              label="Сейчас"
              color={isSameMonth(month, nowMonth) ? "primary" : "default"}
              onClick={() => setMonth(nowMonth)}
              sx={{ ml: 1 }}
            />
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", md: "repeat(5,1fr)" },
              gap: 2,
            }}
          >
            {kpis.map((k) => (
              <Card key={k.key} variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">{k.label}</Typography>
                  <Typography variant="h5">{k.value}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" mb={2}>Снимок статусов на конец месяца</Typography>
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
            В каждом месяце кандидат учитывается один раз — по состоянию на конец месяца.
          </Typography>
        </CardContent>
      </Card>

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