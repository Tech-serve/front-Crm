import { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Stack,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
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
import type { Candidate, Interview } from "src/types/domain";

// ---- Цвета/лейблы ----
const COLORS = {
  not_held: "#3498db",   // В процессе
  reserve:  "#f4a261",   // Полиграф
  success:  "#2ecc71",   // Принято
  declined: "#ff6b6b",   // Отказано
  canceled: "#95a5a6",   // Отказался
};
const LABEL = {
  not_held: "В процессе",
  reserve:  "Полиграф",
  success:  "Принято",
  declined: "Отказано",
  canceled: "Отказался",
} as const;
type BucketKey = keyof typeof LABEL;

const YM = (d: Dayjs) => d.format("YYYY-MM");
const endOfMonth = (d: Dayjs) => d.endOf("month");

// --- Хелперы сравнения месяцев без плагинов dayjs ---
function isSameMonth(a: Dayjs, b: Dayjs) {
  return a.year() === b.year() && a.month() === b.month();
}
function isSameOrBeforeMonth(a: Dayjs, b: Dayjs) {
  return a.year() < b.year() || (a.year() === b.year() && a.month() <= b.month());
}

// Без плагинов dayjs — сравнение дат (<= cutoff) через diff
function isOnOrBefore(d: unknown, cutoff: Dayjs) {
  if (!d) return false;
  const v = dayjs(d as string);
  if (!v.isValid()) return false;
  return v.diff(cutoff, "second") <= 0;
}

// ----- ЛОГИКА -----
// «Живой» статус ТОЛЬКО по полю candidate.status (единый источник истины)
function classifyNow(c: Candidate): BucketKey {
  if (c.status === "success") return "success";
  if (c.status === "declined") return "declined";
  if (c.status === "canceled") return "canceled";
  if (c.status === "reserve")  return "reserve"; // = Полиграф
  return "not_held";
}

// Снимок на КОНЕЦ месяца: определяем по датам событий (acceptedAt/declinedAt/canceledAt/polygraphAt)
function classifyAt(c: Candidate, cutoff: Dayjs): BucketKey {
  if (isOnOrBefore(c.acceptedAt, cutoff)) return "success";
  if (isOnOrBefore(c.declinedAt, cutoff)) return "declined";
  if (isOnOrBefore(c.canceledAt, cutoff)) return "canceled";
  if (isOnOrBefore(c.polygraphAt, cutoff)) return "reserve";
  return "not_held";
}

// События по месяцам считаем по датам в документе кандидата
function addEvent(
  map: Map<string, any>,
  month: string,
  key: "polygraph" | "accepted" | "declined" | "canceled"
) {
  if (!map.has(month)) map.set(month, { month, polygraph: 0, accepted: 0, declined: 0, canceled: 0 });
  map.get(month)![key] += 1;
}

export default function Dashboard() {
  const now = dayjs();
  const nowMonth = now.startOf("month");
  const [month, setMonth] = useState<Dayjs>(nowMonth);

  // Берём всех кандидатов одной страницей
  const { data: page, isLoading, refetch } = useGetCandidatesQuery({ page: 1, pageSize: 1000 });
  const candidates = (page?.items ?? []) as Candidate[];

  // ---- Плашка «Статус на период» ----
  const periodCounts = useMemo(() => {
    const res: Record<BucketKey, number> = {
      not_held: 0, reserve: 0, success: 0, declined: 0, canceled: 0,
    };
    if (isSameMonth(month, nowMonth)) {
      for (const c of candidates) res[classifyNow(c)]++;
      return res;
    }
    const cutoff = endOfMonth(month);
    for (const c of candidates) res[classifyAt(c, cutoff)]++;
    return res;
  }, [candidates, month, nowMonth]);

  // ---- «Снимок статусов на конец месяца» (только до текущего месяца) ----
  const snapshotBars = useMemo(() => {
    const start = dayjs().startOf("year");
    const months: Dayjs[] = [];
    for (let cur = start; isSameOrBeforeMonth(cur, nowMonth); cur = cur.add(1, "month")) {
      months.push(cur);
    }
    return months.map((m) => {
      const cutoff = endOfMonth(m);
      const row: any = { month: YM(m), not_held: 0, reserve: 0, success: 0, declined: 0, canceled: 0 };
      if (isSameMonth(m, nowMonth)) {
        for (const c of candidates) row[classifyNow(c)]++;
      } else {
        for (const c of candidates) row[classifyAt(c, cutoff)]++;
      }
      return row;
    });
  }, [candidates, nowMonth]);

  // ---- «События по месяцам» (по датам), только до текущего месяца ----
  const eventBars = useMemo(() => {
    const map = new Map<string, { month: string; polygraph: number; accepted: number; declined: number; canceled: number }>();
    for (const p of candidates) {
      if (p.polygraphAt) addEvent(map, YM(dayjs(p.polygraphAt)), "polygraph");
      if (p.acceptedAt) addEvent(map, YM(dayjs(p.acceptedAt)), "accepted");
      if (p.declinedAt) addEvent(map, YM(dayjs(p.declinedAt)), "declined");
      if (p.canceledAt) addEvent(map, YM(dayjs(p.canceledAt)), "canceled");
    }
    // заполняем нулями месяцы до текущего
    const start = dayjs().startOf("year");
    for (let cur = start; isSameOrBeforeMonth(cur, nowMonth); cur = cur.add(1, "month")) {
      const key = YM(cur);
      if (!map.has(key)) map.set(key, { month: key, polygraph: 0, accepted: 0, declined: 0, canceled: 0 });
    }
    // только до текущего месяца
    return Array.from(map.values())
      .filter((r) => isSameOrBeforeMonth(dayjs(r.month + "-01"), nowMonth))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [candidates, nowMonth]);

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
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Typography variant="h5" sx={{ mr: "auto" }}>Дашборд кандидатов</Typography>
        <Typography variant="body2" color="text.secondary">
          Диапазон: {dayjs().startOf("year").format("DD.MM.YYYY")} — {dayjs().endOf("month").format("DD.MM.YYYY")}
        </Typography>
        <IconButton
          onClick={() => refetch()}
          disabled={isLoading}
          sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: "#fff", color: "#0f1b2a", border: "1px solid rgba(0,0,0,0.12)", "&:hover": { bgcolor: "#f6f6f6" } }}
          aria-label="Обновить"
        >
          <AutorenewRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* --- Плашка: Статус на период (с переключением месяцев) --- */}
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

      {/* --- Снимок статусов на конец месяца (stacked) --- */}
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
            Текущий месяц равен «как в таблице».
          </Typography>
        </CardContent>
      </Card>

      {/* --- События по месяцам --- */}
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
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            Это именно счётчики событий по датам из карточек кандидатов.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}