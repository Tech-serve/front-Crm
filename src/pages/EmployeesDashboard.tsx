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
  Stack,
  Divider,
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
  ComposedChart,
  Line,
} from "recharts";

import { useGetEmployeesQuery } from "src/api/employeesApi";
import type { Employee as DomainEmployee } from "src/types/employee";
import { DEPARTMENTS } from "src/config/departmentConfig";
import { POSITION_OPTIONS } from "src/config/positionConfig";

/* ===== компактные селекты как в примере кандидатов ===== */
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

/* ===== цвета ===== */
const BLUE_DARK = "#1f2937";
const BLUE = "#1e88e5";
const GREEN = "#2ecc71";
const RED = "#ef4444";
const GRAY = "#94a3b8";

/* ===== типы ===== */
type Employee = DomainEmployee & {
  department?: string | null;
  position?: string | null;
  hiredAt?: string | null;
  terminatedAt?: string | null;
};

type HireTermRow = { month: string; hired: number; terminated: number; headcount: number };
type TenureBucketRow = { bucket: string; count: number };

/* ===== утилиты дат ===== */
const YM = (d: Dayjs) => d.format("YYYY-MM");

function parse(d: unknown): Dayjs | null {
  if (!d) return null;
  const v = dayjs(String(d));
  return v.isValid() ? v : null;
}

function isBetweenInclusive(d: unknown, start: Dayjs, end: Dayjs) {
  const v = parse(d);
  if (!v) return false;
  return v.isAfter(start.subtract(1, "second")) && v.isBefore(end.add(1, "second"));
}

function isSameOrBeforeMonth(a: Dayjs, b: Dayjs) {
  return a.year() < b.year() || (a.year() === b.year() && a.month() <= b.month());
}

/** Сотрудник активен на конец месяца `atEnd`? */
function activeOn(employee: Employee, atEnd: Dayjs) {
  const h = parse(employee.hiredAt);
  if (!h) return false;
  const t = parse(employee.terminatedAt);
  return (h.isBefore(atEnd.add(1, "second")) && (!t || t.isAfter(atEnd)));
}

/** Стаж в месяцах к дате `asOf`, с учётом увольнения (если было) */
function tenureMonths(employee: Employee, asOf: Dayjs) {
  const h = parse(employee.hiredAt);
  if (!h || h.isAfter(asOf)) return 0;
  const end = (() => {
    const t = parse(employee.terminatedAt);
    if (t && t.isBefore(asOf)) return t;
    return asOf;
  })();
  const months = end.diff(h, "month", true);
  return months < 0 ? 0 : months;
}

/** Корректный набор месяцев: с начала года по текущий/выбранный */
function monthsFromYearStart(toMonth: Dayjs) {
  const start = dayjs().startOf("year");
  const arr: Dayjs[] = [];
  for (let cur = start; isSameOrBeforeMonth(cur, toMonth); cur = cur.add(1, "month")) {
    arr.push(cur);
  }
  return arr;
}

/** бакеты стажа */
const TENURE_BUCKETS = [
  { key: "<3m",   min: 0,   max: 3 },
  { key: "3–6m",  min: 3,   max: 6 },
  { key: "6–12m", min: 6,   max: 12 },
  { key: "1–2y",  min: 12,  max: 24 },
  { key: "2–3y",  min: 24,  max: 36 },
  { key: "3–5y",  min: 36,  max: 60 },
  { key: "5y+",   min: 60,  max: Infinity },
] as const;

/* ===== страница ===== */
export default function EmployeesDashboard() {
  const now = dayjs();
  const nowMonth = now.startOf("month");
  const [month, setMonth] = useState<Dayjs>(nowMonth);

  const { data: page } = useGetEmployeesQuery({ page: 1, pageSize: 2000 } as any);
  const employees = useMemo<Employee[]>(
    () => ((page as any)?.items ?? (Array.isArray(page) ? page : [])) as Employee[],
    [page]
  );

  /* фильтры */
  const [department, setDepartment] = useState<string>("all");
  const [position, setPosition] = useState<string>("all");

  const deptOptions = useMemo(
    () =>
      (DEPARTMENTS as readonly any[]).map((d) => ({
        value: typeof d === "string" ? d : d?.value ?? String(d?.label ?? ""),
        label: typeof d === "string" ? d : d?.label ?? String(d?.value ?? ""),
        bg: (d as any).bg ?? "#1f2937",
        fg: (d as any).fg ?? "#0f1b2a",
        dot: (d as any).dot ?? "#9aa4af",
      })),
    []
  );

  const posOptions = useMemo(() => {
    if (department === "all") return Object.values(POSITION_OPTIONS).flat();
    return POSITION_OPTIONS[department] ?? [];
  }, [department]);

  const filtered = useMemo(() => {
    const dep = department.toLowerCase();
    const pos = position.toLowerCase();
    return employees.filter((e) => {
      const depOk = department === "all" || String(e.department ?? "").toLowerCase() === dep;
      const posOk = position === "all" || String(e.position ?? "").toLowerCase() === pos;
      return depOk && posOk;
    });
  }, [employees, department, position]);

  /* KPI на выбранный месяц */
  const periodKPI = useMemo(() => {
    const mStart = month.startOf("month");
    const mEnd = month.endOf("month");

    let hired = 0;
    let terminated = 0;
    let active = 0;

    for (const e of filtered) {
      if (isBetweenInclusive(e.hiredAt, mStart, mEnd)) hired += 1;
      if (isBetweenInclusive(e.terminatedAt, mStart, mEnd)) terminated += 1;
      if (activeOn(e, mEnd)) active += 1;
    }

    // средний/медианный стаж по активным на конец месяца
    const tenures = filtered
      .filter((e) => activeOn(e, mEnd))
      .map((e) => tenureMonths(e, mEnd))
      .sort((a, b) => a - b);

    const avg = tenures.length ? tenures.reduce((s, v) => s + v, 0) / tenures.length : 0;
    const med = tenures.length
      ? tenures.length % 2
        ? tenures[(tenures.length - 1) / 2]
        : (tenures[tenures.length / 2 - 1] + tenures[tenures.length / 2]) / 2
      : 0;

    return {
      hired,
      terminated,
      net: hired - terminated,
      active,
      avgTenureM: Math.round(avg),
      medTenureM: Math.round(med),
    };
  }, [filtered, month]);

  /* Годовой ряд: приёмы/увольнения + headcount */
  const hireTermSeries = useMemo<HireTermRow[]>(() => {
    const months = monthsFromYearStart(month);
    return months.map((m) => {
      const mStart = m.startOf("month");
      const mEnd = m.endOf("month");
      let hired = 0;
      let terminated = 0;
      let headcount = 0;

      for (const e of filtered) {
        if (isBetweenInclusive(e.hiredAt, mStart, mEnd)) hired += 1;
        if (isBetweenInclusive(e.terminatedAt, mStart, mEnd)) terminated += 1;
        if (activeOn(e, mEnd)) headcount += 1;
      }
      return { month: YM(m), hired, terminated, headcount };
    });
  }, [filtered, month]);

  /* Распределение стажа по бакетам (по активным на конец месяца) */
  const tenureBuckets = useMemo<TenureBucketRow[]>(() => {
    const end = month.endOf("month");
    const counts = new Map<string, number>();
    TENURE_BUCKETS.forEach((b) => counts.set(b.key, 0));

    for (const e of filtered) {
      if (!activeOn(e, end)) continue;
      const tm = tenureMonths(e, end);
      const bucket = TENURE_BUCKETS.find((b) => tm >= b.min && tm < b.max) ?? TENURE_BUCKETS[TENURE_BUCKETS.length - 1];
      counts.set(bucket.key, (counts.get(bucket.key) ?? 0) + 1);
    }

    return TENURE_BUCKETS.map((b) => ({ bucket: b.key, count: counts.get(b.key) ?? 0 }));
  }, [filtered, month]);

  const prevMonth = () => setMonth((m) => m.subtract(1, "month"));
  const nextMonth = () => setMonth((m) => (isSameOrBeforeMonth(m, nowMonth) ? m.add(1, "month") : m));

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

      {/* панель фильтров/периода */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, minWidth: 320 }}>
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
                <Dot color={GRAY} /> Все
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
            {posOptions.map((p: any) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </CompactSelect>
        </Box>

        {/* Переключение месяца */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.0 }}>
          <IconButton size="small" onClick={prevMonth} sx={{ color: "#fff", bgcolor: BLUE_DARK, "&:hover": { bgcolor: "#111827" } }}>
            <ChevronLeftRoundedIcon fontSize="small" />
          </IconButton>

          <Chip label={month.format("MM.YYYY")} sx={{ bgcolor: BLUE_DARK, color: "#fff", fontWeight: 500 }} />

          <IconButton size="small" onClick={nextMonth} sx={{ color: "#fff", bgcolor: BLUE_DARK, "&:hover": { bgcolor: "#111827" } }}>
            <ChevronRightRoundedIcon fontSize="small" />
          </IconButton>

          <Chip
            label="Сейчас"
            onClick={() => setMonth(nowMonth)}
            sx={{ bgcolor: BLUE, color: "#fff", fontWeight: 600, ml: 0.5 }}
            clickable
          />
        </Box>
      </Box>

      {/* KPI */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Итоги за {month.format("MMMM YYYY")}</Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", md: "repeat(6,1fr)" },
              gap: 2,
            }}
          >
            {[
              { label: "Принято", value: periodKPI.hired, color: GREEN },
              { label: "Уволено", value: periodKPI.terminated, color: RED },
              { label: "Чистое изменение", value: periodKPI.net, color: BLUE },
              { label: "Активно (на конец мес.)", value: periodKPI.active, color: BLUE_DARK },
              { label: "Средний стаж (мес.)", value: periodKPI.avgTenureM, color: "#0ea5e9" },
              { label: "Медианный стаж (мес.)", value: periodKPI.medTenureM, color: "#14b8a6" },
            ].map((k) => (
              <Card key={k.label} variant="outlined" sx={{ borderTop: `3px solid ${k.color}` }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">{k.label}</Typography>
                  <Typography variant="h5">{k.value}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* График: Приёмы/Увольнения + Headcount */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" mb={1}>Динамика по месяцам (текущий год)</Typography>
          <Box sx={{ width: "100%", height: 360 }}>
            <ResponsiveContainer>
              <ComposedChart data={hireTermSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="hired" name="Принято" yAxisId="left" fill={GREEN} />
                <Bar dataKey="terminated" name="Уволено" yAxisId="left" fill={RED} />
                <Line type="monotone" dataKey="headcount" name="Headcount (конец мес.)" yAxisId="right" stroke={BLUE} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            Headcount считается по активным на конец каждого месяца.
          </Typography>
        </CardContent>
      </Card>

      {/* Распределение стажа (активные на конец месяца) */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1">Распределение стажа на {month.format("DD.MM.YYYY")}</Typography>
            <Typography variant="caption" color="text.secondary">Только активные сотрудники</Typography>
          </Stack>
          <Box sx={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={tenureBuckets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Сотрудников" fill={BLUE_DARK} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <Divider sx={{ mt: 2, mb: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Стаж — полные месяцы между датой приёма и {` `}
            {month.endOf("month").format("DD.MM.YYYY")} (или датой увольнения, если она раньше).
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}