// src/pages/Dashboard.tsx
import { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Stack,
  Divider,
} from "@mui/material";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
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

import { DEPARTMENTS } from "src/config/departmentConfig";
import type { Candidate, InterviewStatus } from "src/types/domain";
import { useGetCandidateMetricsQuery } from "src/api/candidatesApi";

// ——— helpers ———
const STATUS_ORDER: InterviewStatus[] = [
  "not_held",
  "reserve",
  "success",
  "declined",
  "canceled",
];

const STATUS_LABEL: Record<InterviewStatus, string> = {
  not_held: "В процессе",
  reserve: "Полиграф",
  success: "Принято",
  declined: "Отказано",
  canceled: "Отказался",
};

type DeptOption = { value: string; label: string } | string;
const normalizeDept = (dep: DeptOption): { value: string; label: string } =>
  typeof dep === "string" ? { value: dep, label: dep } : dep;

// ——— component ———
export default function Dashboard() {
  const { data, isLoading, refetch } = useGetCandidateMetricsQuery();
  // 1) Стабильный источник кандидатов — фикс react-hooks/exhaustive-deps
  const candidates = useMemo(
    () => (data?.candidates ?? []) as Candidate[],
    [data?.candidates]
  );

  // 2) Селектор вертикали
  const [vertical, setVertical] = useState<string>("all");

  // 3) Фильтр по вертикали
  const filteredCandidates = useMemo(() => {
    if (vertical === "all") return candidates;
    return candidates.filter(
      (c) => (c.department ?? "").toLowerCase() === vertical.toLowerCase()
    );
  }, [candidates, vertical]);

  // 4) Метрики по статусам
  const metricsByStatus = useMemo(() => {
    const counts: Record<InterviewStatus, number> = {
      not_held: 0,
      reserve: 0,
      success: 0,
      declined: 0,
      canceled: 0,
    };
    for (const c of filteredCandidates) {
      const s = (c.statusCode ?? "not_held") as InterviewStatus;
      if (s in counts) counts[s as InterviewStatus]++;
    }
    const total = filteredCandidates.length;
    const accepted = counts.success;
    const rejected = counts.declined + counts.canceled;
    const inProgress = counts.not_held + counts.reserve;
    return { total, accepted, rejected, inProgress, counts };
  }, [filteredCandidates]);

  // 5) Данные для графика (разноцветный нижний барчарт)
  const chartData = useMemo(
    () =>
      STATUS_ORDER.map((st) => ({
        status: STATUS_LABEL[st],
        count: metricsByStatus.counts[st],
      })),
    [metricsByStatus.counts]
  );

  const deptOptions = useMemo(
    () => (DEPARTMENTS as DeptOption[]).map(normalizeDept),
    []
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Панель управления */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ mb: 2, flexWrap: "wrap" }}
      >
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="vertical-select-label">Вертикаль</InputLabel>
          <Select
            labelId="vertical-select-label"
            label="Вертикаль"
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
          >
            <MenuItem value="all">Все вертикали</MenuItem>
            {deptOptions.map((d) => (
              <MenuItem key={d.value} value={d.value}>
                {d.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <IconButton
          size="small"
          onClick={() => refetch()}
          title="Обновить"
          sx={{ ml: "auto" }}
        >
          <AutorenewRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Быстрые метрики */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <MetricCard title="Всего" value={metricsByStatus.total} />
        <MetricCard title="В процессе" value={metricsByStatus.inProgress} />
        <MetricCard title="Принято" value={metricsByStatus.accepted} />
        <MetricCard title="Отказано/Отказался" value={metricsByStatus.rejected} />
      </Stack>

      <Divider sx={{ my: 1 }} />

      {/* Нижний разноцветный график */}
      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ height: 360 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Статусы кандидатов {vertical !== "all" ? `• ${vertical}` : "• Все"}
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              {/* ВАЖНО: не задаём цвет явно (см. инструкции по графикам) */}
              <Bar dataKey="count" name="Кол-во" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {isLoading && (
        <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
          Загрузка…
        </Typography>
      )}
    </Box>
  );
}

// ——— small UI piece ———
function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card sx={{ flex: 1, minWidth: 200 }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}