import { useMemo, useState } from "react";
import { Box, Card, CardContent, Typography, IconButton } from "@mui/material";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import dayjs, { Dayjs } from "dayjs";
import { useGetCandidateMetricsQuery } from "src/api/candidatesApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [from] = useState<Dayjs>(dayjs().startOf("year"));
  const [to] = useState<Dayjs>(dayjs().endOf("month"));

  const { data, isLoading, refetch } = useGetCandidateMetricsQuery({
    from: from.format("YYYY-MM-DD"),
    to: to.format("YYYY-MM-DD"),
  });

  const totals = useMemo(() => {
    const base = { polygraph: 0, accepted: 0, declined: 0, canceled: 0 };
    for (const r of data?.monthly ?? []) {
      base.polygraph += r.polygraph || 0;
      base.accepted  += r.accepted  || 0;
      base.declined  += r.declined  || 0;
      base.canceled  += r.canceled  || 0;
    }
    const created = (data?.firstTouches ?? []).reduce((s, r) => s + (r.created || 0), 0);
    return { ...base, created };
  }, [data?.monthly, data?.firstTouches]);

  const kpis = [
    { label: "Создано",   value: totals.created },
    { label: "Полиграф",  value: totals.polygraph },
    { label: "Принято",   value: totals.accepted },
    { label: "Отказано",  value: totals.declined },
    { label: "Отказался", value: totals.canceled },
  ];

  const colors = {
    polygraph: "#f4a261",
    accepted: "#2ecc71",
    declined: "#ff6b6b",
    canceled: "#95a5a6",
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Typography variant="h5" sx={{ mr: "auto" }}>
          Дашборд кандидатов
        </Typography>
        <IconButton
          onClick={() => refetch()}
          disabled={isLoading}
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: "#ffffff",
            color: "#0f1b2a",
            border: "1px solid rgba(0,0,0,0.12)",
            "&:hover": { bgcolor: "#f6f6f6" },
          }}
          aria-label="Обновить"
        >
          <AutorenewRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", md: "repeat(5,1fr)" },
          gap: 2,
          mb: 2,
        }}
      >
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {k.label}
              </Typography>
              <Typography variant="h5">{k.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" mb={2}>
            События по месяцам
          </Typography>
          <Box sx={{ width: "100%", height: 340 }}>
            <ResponsiveContainer>
              <BarChart data={data?.monthly || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="polygraph" name="Полиграф"  fill={colors.polygraph} />
                <Bar dataKey="accepted"  name="Принято"   fill={colors.accepted} />
                <Bar dataKey="declined"  name="Отказано"  fill={colors.declined} />
                <Bar dataKey="canceled"  name="Отказался" fill={colors.canceled} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}