// src/pages/EmployeesDashboard.tsx
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

import { useGetEmployeesQuery } from "src/api/employeesApi";
import type { Employee } from "src/types/domain";
import { DEPARTMENTS } from "src/config/departmentConfig";
import { POSITION_OPTIONS } from "src/config/positionConfig";

/* ===== Локальные типы/хелперы для безопасной индексации ===== */
type DepartmentKey = keyof typeof POSITION_OPTIONS;
type PositionOption = (typeof POSITION_OPTIONS)[DepartmentKey][number];

// Безопасно приводим произвольную строку к ключу словаря отделов.
// Если отдел неизвестен — дефолтим к "Gambling".
const asDeptKey = (v: unknown): DepartmentKey => {
  return typeof v === "string" && v in POSITION_OPTIONS
    ? (v as DepartmentKey)
    : "Gambling";
};

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

/* ===== Цвета/лейблы событий ===== */
const COLORS = {
  hired: "#2ecc71",      // Принято
  terminated: "#ff6b6b", // Уволено
} as const;

/* ===== Даты ===== */
const YM = (d: Dayjs) => d.format("YYYY-MM");
function isSameMonth(a: Dayjs, b: Dayjs) { return a.year() === b.year() && a.month() === b.month(); }
function isSameOrBeforeMonth(a: Dayjs, b: Dayjs) {
  return a.year() < b.year() || (a.year() === b.year() && a.month() <= b.month());
}
function isBetweenInclusive(d: unknown, start: Dayjs, end: Dayjs) {
  if (!d) return false;
  const v = dayjs(d as string);
  if (!v.isValid()) return false;
  return v.isAfter(start.subtract(1, "second")) && v.isBefore(end.add(1, "second"));
}

/* ===== Типы рядов для графиков ===== */
type DailyRow = { day: string; hired: number; terminated: number };
type MonthlyRow = { month: string; hired: number; terminated: number };

export default function EmployeesDashboard() {
  const now = dayjs();
  const nowMonth = now.startOf("month");
  const [month, setMonth] = useState<Dayjs>(nowMonth);

  // данные сотрудников
  const { data: page } = useGetEmployeesQuery({ page: 1, pageSize: 1000 });
  const employees = useMemo(() => ((page?.items as Employee[]) ?? []), [page?.items]);

  /* ===== Фильтры: Отдел + Должность ===== */
  const [department, setDepartment] = useState<string>("all");
  const [position, setPosition] = useState<string>("all");

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

  // ⚙️ Типобезопасный доступ к POSITION_OPTIONS — НЕТ индексации по string
  const posOptions: readonly PositionOption[] = useMemo(() => {
    if (department === "all") return Object.values(POSITION_OPTIONS).flat();
    return POSITION_OPTIONS[asDeptKey(department)] ?? [];
  }, [department]);

  // Применяем фильтры
  const filtered = useMemo(() => {
    const dep = department.toLowerCase();
    const pos = position.toLowerCase();
    return employees.filter((e) => {
      const depOk =
        department === "all" ||
        String((e as any).department ?? "").toLowerCase() === dep;
      const posOk =
        position === "all" ||
        String((e as any).position ?? "").toLowerCase() === pos;
      return depOk && posOk;
    });
  }, [employees, department, position]);

  /* ===== KPI по выбранному месяцу ===== */
  const kpi = useMemo(() => {
    const start = month.startOf("month");
    const end = month.endOf("month");

    let hired = 0;
    let terminated = 0;
    let active = 0; // активные на конец месяца

    for (const e of filtered) {
      if (isBetweenInclusive((e as any).hiredAt, start, end)) hired += 1;
      if (isBetweenInclusive((e as any).terminatedAt, start, end)) terminated += 1;

      // активен, если нанят до конца периода и не уволен до конца периода
      const hiredBeforeOrIn =
        !!(e as any).hiredAt && dayjs((e as any).hiredAt).isBefore(end.add(1, "second"));
      const notTerminatedByEnd =
        !(e as any).terminatedAt || dayjs((e as any).terminatedAt).isAfter(end);
      if (hiredBeforeOrIn && notTerminatedByEnd) active += 1;
    }

    return { hired, terminated, active };
  }, [filtered, month]);

  /* ===== График по ДНЯМ выбранного месяца ===== */
  const dailyBars = useMemo<DailyRow[]>(() => {
    const start = month.startOf("month");
    const end   = month.endOf("month");
    const days: Dayjs[] = [];
    for (let d = start; d.isBefore(end.add(1, "day")); d = d.add(1, "day")) days.push(d);

    return days.map((d) => {
      const dStart = d.startOf("day");
      const dEnd   = d.endOf("day");
      let hired = 0;
      let terminated = 0;

      for (const e of filtered) {
        if (isBetweenInclusive((e as any).hiredAt, dStart, dEnd)) hired += 1;
        if (isBetweenInclusive((e as any).terminatedAt, dStart, dEnd)) terminated += 1;
      }
      return { day: d.format("DD"), hired, terminated };
    });
  }, [filtered, month]);

  /* ===== График по МЕСЯЦАМ с начала года ===== */
  const monthlyBars = useMemo<MonthlyRow[]>(() => {
    const start = dayjs().startOf("year");
    const map = new Map<string, MonthlyRow>();
    // заполним все месяцы до текущего
    for (let cur = start; isSameOrBeforeMonth(cur, nowMonth); cur = cur.add(1, "month")) {
      const m = YM(cur);
      map.set(m, { month: m, hired: 0, terminated: 0 });
    }
    for (const e of filtered) {
      if ((e as any).hiredAt) {
        const m = YM(dayjs((e as any).hiredAt));
        if (map.has(m)) map.get(m)!.hired += 1;
      }
      if ((e as any).terminatedAt) {
        const m = YM(dayjs((e as any).terminatedAt));
        if (map.has(m)) map.get(m)!.terminated += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [filtered, nowMonth]);

  const prevMonth = () => setMonth((m) => m.subtract(1, "month"));
  const nextMonth = () => setMonth((m) => (isSameMonth(m, nowMonth) ? m : m.add(1, "month")));

  const currentDept = useMemo(() => {
    if (department === "all") return { value: "all", label: "Все", bg: "#334155", fg: "#fff", dot: "#9aa4af" };
    return (
      deptOptions.find((d) => d.value === department) ??
      { value: department, label: department, bg: "#334155", fg: "#fff", dot: "#9aa4af" }
    );
  }, [department, deptOptions]);

  const positionBg = department === "all" ? "#475569" : currentDept.bg;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ mb: 1 }}>Дашборд сотрудников</Typography>

      {/* Шапка: фильтры и период */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        {/* Левая группа: селекты */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, minWidth: 360 }}>
          {/* Отдел */}
          <CompactSelect
            size="small"
            value={department}
            onChange={(e) => { setDepartment(String(e.target.value)); setPosition("all"); }}
            sx={{ width: WIDTH, bgcolor: currentDept.bg, color: "#fff", "& .MuiSvgIcon-root": { color: "#fff" } }}
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
            sx={{ width: WIDTH, bgcolor: positionBg, color: "#fff", "& .MuiSvgIcon-root": { color: "#fff" } }}
            MenuProps={{ PaperProps: { sx: { mt: 0.5 } } }}
          >
            <MenuItem value="all">Все</MenuItem>
            {posOptions.map((p) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </CompactSelect>
        </Box>

        {/* Правая группа: период и “Сейчас” */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.0 }}>
          <IconButton size="small" onClick={prevMonth} sx={{ color: "#fff", bgcolor: "#1f2937", "&:hover": { bgcolor: "#111827" } }}>
            <ChevronLeftRoundedIcon fontSize="small" />
          </IconButton>

          <Chip label={month.format("MM.YYYY")} sx={{ bgcolor: "#1f2937", color: "#fff", fontWeight: 500 }} />

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

      {/* KPI */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Итоги за {month.format("MM.YYYY")}</Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(3,1fr)", sm: "repeat(3,1fr)", md: "repeat(3,1fr)" },
              gap: 2,
            }}
          >
            {[
              { key: "hired" as const, color: COLORS.hired, label: "Принято", value: kpi.hired },
              { key: "terminated" as const, color: COLORS.terminated, label: "Уволено", value: kpi.terminated },
              { key: "active" as const, color: "#3498db", label: "Активно на конец месяца", value: kpi.active },
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

      {/* График 1: по дням месяца */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" mb={2}>События по дням (месяц {month.format("MM.YYYY")})</Typography>
          <Box sx={{ width: "100%", height: 340 }}>
            <ResponsiveContainer>
              <BarChart data={dailyBars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="hired" name="Принято" fill={COLORS.hired} />
                <Bar dataKey="terminated" name="Уволено" fill={COLORS.terminated} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* График 2: по месяцам (YTD) */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" mb={2}>События по месяцам</Typography>
          <Box sx={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyBars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="hired" name="Принято" fill={COLORS.hired} />
                <Bar dataKey="terminated" name="Уволено" fill={COLORS.terminated} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}