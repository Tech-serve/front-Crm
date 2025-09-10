import { useEffect, useMemo, useState } from "react";
import {
  Box, Card, CardContent, Typography, Stack, TextField, MenuItem, Switch, FormControlLabel, Button, Divider, Chip,
} from "@mui/material";
import { useAppSelector } from "src/store/store";

type Prefs = {
  theme: "system" | "light" | "dark";
  tableDensity: "comfortable" | "compact";
  rowsPerPage: 20 | 50 | 100;
  homePage: "dashboard" | "employees-dashboard" | "calendar";
  calendarView: "month" | "week" | "day";
  notifyMeets1h: boolean;
  notifyBirthdays: boolean;
  telegramChatId: string; // пожелание на будущее
  defaultMeetingMinutes: 30 | 45 | 60;
};

const DEFAULTS: Prefs = {
  theme: "system",
  tableDensity: "comfortable",
  rowsPerPage: 20,
  homePage: "dashboard",
  calendarView: "month",
  notifyMeets1h: true,
  notifyBirthdays: true,
  telegramChatId: "",
  defaultMeetingMinutes: 60,
};

const KEY = "crm:prefs:v1";

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}
function savePrefs(p: Prefs) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export default function SettingsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());

  useEffect(() => savePrefs(prefs), [prefs]);

  const roleList = useMemo(() => {
    const r = (user as any)?.roles ?? [];
    return Array.isArray(r) ? r : [];
  }, [user]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5" sx={{ mb: 0.5 }}>Настройки</Typography>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Профиль</Typography>
          <Stack spacing={1.2} sx={{ maxWidth: 560 }}>
            <TextField label="Email" value={user?.email ?? ""} size="small" InputProps={{ readOnly: true }} />
            <TextField
              label="Роли"
              value={(roleList as string[]).join(", ") || "—"}
              size="small"
              InputProps={{ readOnly: true }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Интерфейс</Typography>
          <Stack spacing={1.2} sx={{ maxWidth: 680 }}>
            <TextField
              select size="small" label="Тема"
              value={prefs.theme}
              onChange={(e) => setPrefs((p) => ({ ...p, theme: e.target.value as Prefs["theme"] }))}
            >
              <MenuItem value="system">Системная</MenuItem>
              <MenuItem value="light">Светлая</MenuItem>
              <MenuItem value="dark">Тёмная</MenuItem>
            </TextField>

            <TextField
              select size="small" label="Плотность таблиц"
              value={prefs.tableDensity}
              onChange={(e) => setPrefs((p) => ({ ...p, tableDensity: e.target.value as Prefs["tableDensity"] }))}
            >
              <MenuItem value="comfortable">Обычная</MenuItem>
              <MenuItem value="compact">Компактная</MenuItem>
            </TextField>

            <TextField
              select size="small" label="Строк на страницу (по умолчанию)"
              value={prefs.rowsPerPage}
              onChange={(e) => setPrefs((p) => ({ ...p, rowsPerPage: Number(e.target.value) as Prefs["rowsPerPage"] }))}
            >
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </TextField>

            <Divider sx={{ my: 1 }} />

            <TextField
              select size="small" label="Домашняя страница"
              value={prefs.homePage}
              onChange={(e) => setPrefs((p) => ({ ...p, homePage: e.target.value as Prefs["homePage"] }))}
              helperText="На будущее: можно будет редиректить сюда после входа"
            >
              <MenuItem value="dashboard">Дашборд кандидатов</MenuItem>
              <MenuItem value="employees-dashboard">Дашборд сотрудников</MenuItem>
              <MenuItem value="calendar">Календарь</MenuItem>
            </TextField>

            <TextField
              select size="small" label="Стартовый вид календаря"
              value={prefs.calendarView}
              onChange={(e) => setPrefs((p) => ({ ...p, calendarView: e.target.value as Prefs["calendarView"] }))}
            >
              <MenuItem value="month">Месяц</MenuItem>
              <MenuItem value="week">Неделя</MenuItem>
              <MenuItem value="day">День</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Уведомления</Typography>
          <Stack spacing={1.2} sx={{ maxWidth: 680 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={prefs.notifyMeets1h}
                  onChange={(e) => setPrefs((p) => ({ ...p, notifyMeets1h: e.target.checked }))}
                />
              }
              label="Напоминать о митах за 1 час"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={prefs.notifyBirthdays}
                  onChange={(e) => setPrefs((p) => ({ ...p, notifyBirthdays: e.target.checked }))}
                />
              }
              label="Уведомлять о днях рождения"
            />

            <TextField
              size="small"
              label="Telegram chat ID"
              value={prefs.telegramChatId}
              onChange={(e) => setPrefs((p) => ({ ...p, telegramChatId: e.target.value }))}
              helperText="Для будущей интеграции. Сейчас сохраняется локально."
            />

            <TextField
              select size="small" label="Длительность встречи по умолчанию"
              value={prefs.defaultMeetingMinutes}
              onChange={(e) => setPrefs((p) => ({ ...p, defaultMeetingMinutes: Number(e.target.value) as Prefs["defaultMeetingMinutes"] }))}
            >
              <MenuItem value={30}>30 минут</MenuItem>
              <MenuItem value={45}>45 минут</MenuItem>
              <MenuItem value={60}>60 минут</MenuItem>
            </TextField>

            <Box>
              <Chip
                label="Сбросить настройки"
                color="default"
                onClick={() => setPrefs(DEFAULTS)}
                variant="outlined"
                sx={{ mr: 1 }}
              />
              <Button
                variant="outlined"
                onClick={() => {
                  localStorage.removeItem(KEY);
                  setPrefs(DEFAULTS);
                }}
              >
                Полный сброс (localStorage)
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}