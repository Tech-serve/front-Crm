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

/* ================== локальные типы ================== */
// Ключи отделов из POSITION_OPTIONS (типобезопасно, без импорта DepartmentValue)
type DepartmentKey = keyof typeof POSITION_OPTIONS;
// Опция должности для выбранного отдела
type PositionOption = (typeof POSITION_OPTIONS)[DepartmentKey][number];

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
  not_held: "#3498db",   // В процессе (считаем только в день/месяц создания)
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

/* ===== строки для графиков ===== */
type DailyRow = { day: string } & Record<BucketKey, number>;
type EventRow = { month: string; polygraph: number; accepted: number; declined: number; canceled: number};

/* ===== утилиты дат ===== */
const YM = (d: Dayjs) => d.format("YYYY-MM");
function isSameMonth(a: Dayjs, b: Dayjs) { return a.year() === b.year() && a.month() === b.month(); }
function isSameOrBeforeMonth(a: Dayjs, b: Dayjs) { return a.year() < b.year() || (a.year() === b.year() && a.month() <= b.month()); }
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

  /* ===== фильтры: Отдел + Должность + Локация ===== */
  const [department, setDepartment] = useState<string>("all");
  const [position, setPosition] = useState<string>("all");
  const [location, setLocation] = useState<string>("all");

  // DEPARTMENTS приводим к единому виду для селекта
  const deptOptions = useMemo(
    () =>
      (DEPARTMENTS as readonly any[]).map((d) => ({
        value: typeof d === "string" ? d : d?.value ?? String(d?.label ?? ""),
        label: typeof d === "string" ? d : d?.label ?? String(d?.value ?? ""),
        bg:    (d as any).bg ?? "#1f2937",
        fg:    (d as any).fg ?? "#0f1b2a",
        dot:   (d as any).dot ?? "#9aa4af",
      })),
    []
  );

  // Типобезопасный доступ к POSITION_OPTIONS
  const posOptions: readonly PositionOption[] = useMemo(() => {
    if (department === "all") return Object.values(POSITION_OPTIONS).flat();
    const key = department as DepartmentKey;
    return POSITION_OPTIONS[key] ?? [];
  }, [department]);

  // Локации собираем из данных
  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of candidates) {
      const v = String((c as any).location ?? "").trim();
      if (v) set.add(v);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [candidates]);

  // Применяем фильтры к кандидатам
  const filteredCandidates = useMemo(() => {
    const dep = department.toLowerCase();
    const pos = position.toLowerCase();
    const loc = location.toLowerCase();

    return candidates.filter((c) => {
      const depOk =
        department === "all" ||
        String((c as any).department ?? "").toLowerCase() === dep;

      const posOk =
        position === "all" ||
        String((c as any).position ?? "").toLowerCase() === pos;

      const locOk =
        location === "all" ||
        String((c as any).location ?? "").toLowerCase() === loc;

      return depOk && posOk && locOk;
    });
  }, [candidates, department, position, location]);

  /* ===== KPI «статус на период» (по выбранному месяцу) ===== */
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

  /* ===== Снимок статусов по ДНЯМ выбранного месяца ===== */
  const dailyBars = useMemo<DailyRow[]>(() => {
    const start = month.startOf("month");
    const end   = month.endOf("month");
    const days: Dayjs[] = [];
    for (let d = start; d.isBefore(end.add(1, "day")); d = d.add(1, "day")) days.push(d);

    return days.map((d) => {
      const dStart = d.startOf("day");
      const dEnd   = d.endOf("day");
      const row: DailyRow = { day: d.format("DD"), not_held: 0, reserve: 0, success: 0, declined: 0, canceled: 0 };

      for (const c of filteredCandidates) {
        if (isBetweenInclusive((c as any).acceptedAt,  dStart, dEnd)) { row.success  += 1; continue; }
        if (isBetweenInclusive((c as any).declinedAt,  dStart, dEnd)) { row.declined += 1; continue; }
        if (isBetweenInclusive((c as any).canceledAt,  dStart, dEnd)) { row.canceled += 1; continue; }
        if (isBetweenInclusive((c as any).polygraphAt, dStart, dEnd)) { row.reserve  += 1; continue; }
        if (isBetweenInclusive((c as any).createdAt,   dStart, dEnd)) { row.not_held += 1; } // только день создания
      }
      return row;
    });
  }, [filteredCandidates, month]);

  /* ===== «События по МЕСЯЦАМ» (как было) ===== */
  const eventBars = useMemo<EventRow[]>(() => {
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
      if (!map.has(key)) map.set(key, { month: key, polygraph: 0, accepted: 0, declined: 0, canceled: 0 });
    }

    return Array.from(map.values())
      .filter((r) => isSameOrBeforeMonth(dayjs(r.month + "-01"), nowMonth))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredCandidates, nowMonth]);

  const prevMonth = () => setMonth((m) => m.subtract(1, "month"));
  const nextMonth = () => setMonth((m) => (isSameMonth(m, nowMonth) ? m : m.add(1, "month")));

  const currentDept = useMemo(() => {
    if (department === "all") return { value: "all", label: "Все", bg: "#334155", fg: "#fff", dot: "#9aa4af" };
    return (
      deptOptions.find((d) => d.value === department) ??
      { value: department, label: department, bg: "#334155", fg: "#fff", dot: "#9aa4af" }
    );
  }, [department, deptOptions]);

  // фон для селекта должности — в цвет текущей вертикали; белый текст
  const positionBg = department === "all" ? "#475569" : currentDept.bg;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Заголовок без большого отступа */}
      <Typography variant="h5" sx={{ mb: 1 }}>Дашборд кандидатов</Typography>

      {/* ---- ШАПКА: фильтры и период ---- */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        {/* Левая группа: селекты */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, minWidth: 480 }}>
          {/* Отдел */}
          <CompactSelect
            size="small"
            value={department}
            onChange={(e) => { setDepartment(String(e.target.value)); setPosition("all"); }}
            sx={{
              width: WIDTH,
              bgcolor: currentDept.bg,
              color: "#fff",
              "& .MuiSvgIcon-root": { color: "#fff" },
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

          {/* Должность */}
          <CompactSelect
            size="small"
            value={position}
            onChange={(e) => setPosition(String(e.target.value))}
            sx={{
              width: WIDTH,
              bgcolor: positionBg,
              color: "#fff",
              "& .MuiSvgIcon-root": { color: "#fff" },
            }}
            MenuProps={{ PaperProps: { sx: { mt: 0.5 } } }}
          >
            <MenuItem value="all">Все</MenuItem>
            {posOptions.map((p) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </CompactSelect>

          {/* Локация */}
          <CompactSelect
            size="small"
            value={location}
            onChange={(e) => setLocation(String(e.target.value))}
            sx={{
              width: WIDTH,
              bgcolor: "#475569",
              color: "#fff",
              "& .MuiSvgIcon-root": { color: "#fff" },
            }}
            MenuProps={{ PaperProps: { sx: { mt: 0.5 } } }}
          >
            <MenuItem value="all">Все локации</MenuItem>
            {locationOptions.filter((v) => v !== "all").map((v) => (
              <MenuItem key={v} value={v}>{v}</MenuItem>
            ))}
          </CompactSelect>
        </Box>

        {/* Правая группа: период и “Сейчас” */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.0 }}>
          <IconButton size="small" onClick={prevMonth} sx={{ color: "#fff", bgcolor: "#1f2937", "&:hover": { bgcolor: "#111827" } }}>
            <ChevronLeftRoundedIcon fontSize="small" />
          </IconButton>

          <Chip
            label={month.format("MM.YYYY")}
            sx={{ bgcolor: "#1f2937", color: "#fff", fontWeight: 500 }}
          />

          <IconButton size="small" onClick={nextMonth} sx={{ color: "#fff", bgcolor: "#1f2937", "&:hover": { bgcolor: "#111827" } }}>
            <ChevronRightRoundedIcon fontSize="small" />
          </IconButton>

          <Chip
            label="Сейчас"
            onClick={() => setMonth(nowMonth)}
            sx={{ bgcolor: "primary.main", color: "#fff", fontWeight: 600, ml: 0.5 }}
            clickable
          />
        </Box>
      </Box>
      {/* ---- /ШАПКА ---- */}

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

      {/* График #1: по ДНЯМ выбранного месяца (stacked) */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" mb={2}>Снимок статусов по дням (месяц {month.format("MM.YYYY")})</Typography>
          <Box sx={{ width: "100%", height: 340 }}>
            <ResponsiveContainer>
              <BarChart data={dailyBars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="not_held" name={LABEL.not_held} stackId="d" fill={COLORS.not_held} />
                <Bar dataKey="reserve"  name={LABEL.reserve}  stackId="d" fill={COLORS.reserve} />
                <Bar dataKey="success"  name={LABEL.success}  stackId="d" fill={COLORS.success} />
                <Bar dataKey="declined" name={LABEL.declined} stackId="d" fill={COLORS.declined} />
                <Bar dataKey="canceled" name={LABEL.canceled} stackId="d" fill={COLORS.canceled} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            «В процессе» учитывается только в день создания кандидата.
          </Typography>
        </CardContent>
      </Card>

      {/* График #2: события по МЕСЯЦАМ (как было) */}
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