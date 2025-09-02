// src/pages/Calendar.tsx
import { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Stack,
  Tooltip,
  Divider,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import ViewModuleRoundedIcon from "@mui/icons-material/ViewModuleRounded";
import ViewWeekRoundedIcon from "@mui/icons-material/ViewWeekRounded";
import ViewDayRoundedIcon from "@mui/icons-material/ViewDayRounded";
import dayjs, { Dayjs } from "dayjs";

import { useGetEmployeesQuery } from "src/api/employeesApi";
import { useGetCandidatesQuery } from "src/api/candidatesApi";
import type { Candidate as DomainCandidate } from "src/types/domain";

/* ===================== Голубо-белая тема ===================== */
const BG_LIGHT = "#EAF2FF";
const BG_LIGHTER = "#F5F9FF";
const BLUE = "#1e88e5";
const BLUE_DARK = "#1f2937";

const EVENT_COLORS = {
  birthday: { bg: "#E3F2FD", fg: "#0D47A1", dot: "#64B5F6" },
  meet: { bg: "#E0F7FA", fg: "#006064", dot: "#4DD0E1" },
} as const;

/* ===================== Типы ===================== */
type ViewMode = "month" | "week" | "day";

type Employee = {
  _id: string;
  fullName: string;
  birthdayAt?: string | null;
  department?: string | null;
  position?: string | null;
};

type Candidate = DomainCandidate & {
  _id?: string;
  fullName?: string;
  department?: string | null;
  position?: string | null;
  meetLink?: string | null;
  scheduledAt?: string | null;
  meetingAt?: string | null;
  interviewAt?: string | null;
  googleMeetAt?: string | null;
  meetAt?: string | null;
};

type CalEvent = {
  id: string;
  kind: "birthday" | "meet";
  date: string;        // YYYY-MM-DD
  time?: string;       // HH:mm
  title: string;       // имя человека
  subtitle?: string;   // тип события
  link?: string;       // ссылка на Meet
};

/* ===================== Утилиты ===================== */
const startOfView = (focus: Dayjs, mode: ViewMode) =>
  mode === "month" ? focus.startOf("month").startOf("week")
  : mode === "week" ? focus.startOf("week")
  : focus.startOf("day");

const endOfView = (focus: Dayjs, mode: ViewMode) =>
  mode === "month" ? focus.endOf("month").endOf("week")
  : mode === "week" ? focus.endOf("week")
  : focus.endOf("day");

const toYMD = (d: Dayjs) => d.format("YYYY-MM-DD");

function getMeetMeta(c: Partial<Candidate>): { when: Dayjs | null; link?: string } {
  const raw =
    c.meetingAt ??
    c.scheduledAt ??
    (c as any)?.meetAt ??
    c.interviewAt ??
    c.googleMeetAt ??
    null;
  const when = raw ? dayjs(raw) : null;
  return { when: when && when.isValid() ? when : null, link: (c as any)?.meetLink ?? undefined };
}

function birthdayInYear(bday: string | null | undefined, year: number): Dayjs | null {
  if (!bday) return null;
  const d = dayjs(bday);
  if (!d.isValid()) return null;
  const copy = dayjs(new Date(year, d.month(), d.date()));
  return copy.isValid() ? copy : null;
}

/* ===================== Страница ===================== */
export default function CalendarPage() {
  const today = dayjs().startOf("day");
  const [mode, setMode] = useState<ViewMode>("month");
  const [focus, setFocus] = useState<Dayjs>(today);

  // запросы к двум базам
  const { data: employeesPage } = useGetEmployeesQuery({ page: 1, pageSize: 2000 } as any);
  const { data: candidatesPage } = useGetCandidatesQuery({ page: 1, pageSize: 2000 } as any);

  const employees: Employee[] = useMemo(() => {
    const arr =
      (employeesPage as any)?.items ??
      (employeesPage as any)?.list ??
      (Array.isArray(employeesPage) ? employeesPage : []);
    return (arr ?? []) as Employee[];
  }, [employeesPage]);

  const candidates: Candidate[] = useMemo(() => {
    const arr =
      (candidatesPage as any)?.items ??
      (candidatesPage as any)?.list ??
      (Array.isArray(candidatesPage) ? candidatesPage : []);
    return (arr ?? []) as Candidate[];
  }, [candidatesPage]);

  // диапазон текущего представления
  const rangeStart = useMemo(() => startOfView(focus, mode), [focus, mode]);
  const rangeEnd = useMemo(() => endOfView(focus, mode), [focus, mode]);

  // сбор событий
  const events = useMemo<CalEvent[]>(() => {
    const out: CalEvent[] = [];

    // Дни рождения (повторяются ежегодно), берём только попадающие в видимый диапазон
    const yearStart = rangeStart.year();
    const yearEnd = rangeEnd.year();
    for (const emp of employees) {
      for (let y = yearStart; y <= yearEnd; y++) {
        const bd = birthdayInYear(emp.birthdayAt ?? undefined, y);
        if (!bd) continue;
        if (bd.isBefore(rangeStart) || bd.isAfter(rangeEnd)) continue;
        out.push({
          id: `b-${emp._id}-${y}`,
          kind: "birthday",
          date: toYMD(bd),
          title: emp.fullName ?? "Сотрудник",
          subtitle: "День рождения",
        });
      }
    }

    // Встречи кандидатов (дата + ссылка)
    for (const cand of candidates) {
      const { when, link } = getMeetMeta(cand);
      if (!when) continue;
      if (when.isBefore(rangeStart) || when.isAfter(rangeEnd)) continue;
      out.push({
        id: `m-${cand._id ?? (cand as any).id ?? Math.random()}`,
        kind: "meet",
        date: toYMD(when),
        time: when.format("HH:mm"),
        title: cand.fullName ?? "Кандидат",
        subtitle: "Google Meet",
        link,
      });
    }

    // --- правильная сортировка: date -> time
    out.sort((a, b) => {
      const aKey = `${a.date}T${a.time ?? "99:99"}`;
      const bKey = `${b.date}T${b.time ?? "99:99"}`;
      return aKey.localeCompare(bKey);
    });

    return out;
  }, [employees, candidates, rangeStart, rangeEnd]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return map;
  }, [events]);

  // навигация
  const goPrev = () =>
    setFocus((d) =>
      mode === "month" ? d.subtract(1, "month")
      : mode === "week" ? d.subtract(1, "week")
      : d.subtract(1, "day")
    );
  const goNext = () =>
    setFocus((d) =>
      mode === "month" ? d.add(1, "month")
      : mode === "week" ? d.add(1, "week")
      : d.add(1, "day")
    );
  const goToday = () => setFocus(today);

  /* ===================== Render ===================== */
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ mb: 1 }}>Календарь</Typography>

      {/* Шапка управления */}
      <Card sx={{ mb: 2, border: "1px solid #e5eefc", background: BG_LIGHTER }}>
        <CardContent
          sx={{
            py: 1.25,
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "space-between",
          }}
        >
          {/* Вид: месяц/неделя/день */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip icon={<ViewModuleRoundedIcon />} label="Месяц" onClick={() => setMode("month")}
              variant={mode === "month" ? "filled" : "outlined"} sx={chipSx(mode === "month")} clickable />
            <Chip icon={<ViewWeekRoundedIcon />} label="Неделя" onClick={() => setMode("week")}
              variant={mode === "week" ? "filled" : "outlined"} sx={chipSx(mode === "week")} clickable />
            <Chip icon={<ViewDayRoundedIcon />} label="День" onClick={() => setMode("day")}
              variant={mode === "day" ? "filled" : "outlined"} sx={chipSx(mode === "day")} clickable />
          </Stack>

          {/* Навигация */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Назад">
              <IconButton onClick={goPrev} sx={navBtnSx}><ChevronLeftRoundedIcon /></IconButton>
            </Tooltip>

            <Chip
              label={
                mode === "month"
                  ? focus.format("MMMM YYYY")
                  : mode === "week"
                  ? `${focus.startOf("week").format("DD.MM")}–${focus.endOf("week").format("DD.MM.YYYY")}`
                  : focus.format("DD MMMM YYYY")
              }
              sx={{ bgcolor: BLUE_DARK, color: "#fff", fontWeight: 600 }}
            />

            <Tooltip title="Вперёд">
              <IconButton onClick={goNext} sx={navBtnSx}><ChevronRightRoundedIcon /></IconButton>
            </Tooltip>

            <Tooltip title="Сегодня">
              <Chip
                icon={<TodayRoundedIcon sx={{ color: "#fff !important" }} />}
                label="Сегодня"
                onClick={goToday}
                sx={{ bgcolor: BLUE, color: "#fff", fontWeight: 600 }}
                clickable
              />
            </Tooltip>
          </Stack>
        </CardContent>
      </Card>

      {/* Представления */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          {mode === "month" && (
            <MonthView start={startOfView(focus, "month")} end={endOfView(focus, "month")} today={today} eventsByDate={eventsByDate} />
          )}
          {mode === "week" && (
            <WeekView start={startOfView(focus, "week")} today={today} eventsByDate={eventsByDate} />
          )}
          {mode === "day" && (
            <DayView day={focus.startOf("day")} today={today} eventsByDate={eventsByDate} />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

/* ===================== Представления ===================== */

function MonthView({
  start,
  end,
  today,
  eventsByDate,
}: {
  start: Dayjs;
  end: Dayjs;
  today: Dayjs;
  eventsByDate: Map<string, CalEvent[]>;
}) {
  const days: Dayjs[] = [];
  for (let d = start; d.isBefore(end) || d.isSame(end, "day"); d = d.add(1, "day")) days.push(d);

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
      {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((w) => (
        <Box key={w} sx={{ px: 1, py: 0.5, color: BLUE_DARK, fontWeight: 600 }}>{w}</Box>
      ))}
      {days.map((d) => {
        const key = toYMD(d);
        const ev = eventsByDate.get(key) ?? [];
        const isToday = d.isSame(today, "day");
        const isPast = d.isBefore(today, "day");
        const isOtherMonth = d.month() !== start.month();

        return (
          <Box
            key={key}
            sx={{
              minHeight: 132,
              bgcolor: isToday ? "#DCEBFF" : BG_LIGHT,
              border: "1px solid #e5eefc",
              borderRadius: 1.5,
              p: 1,
              opacity: isPast ? 0.5 : 1,
              filter: isOtherMonth ? "grayscale(18%)" : "none",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: isToday ? BLUE_DARK : "#334155" }}>
                {d.format("D")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {ev.length ? `${ev.length} событ.` : ""}
              </Typography>
            </Box>

            {/* СКРОЛЛИРУЕМЫЙ ЛИСТ СОБЫТИЙ */}
            <Box sx={{ mt: 0.5, overflowY: "auto", maxHeight: 92, pr: 0.5 }}>
              <Stack spacing={0.5}>
                {ev.map((e) => <EventBand key={e.id} e={e} />)}
                {ev.length === 0 && (
                  <Typography variant="caption" color="text.secondary">Нет событий</Typography>
                )}
              </Stack>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function WeekView({
  start,
  today,
  eventsByDate,
}: {
  start: Dayjs; // startOf('week')
  today: Dayjs;
  eventsByDate: Map<string, CalEvent[]>;
}) {
  const cols: Dayjs[] = [];
  for (let d = start; d.isBefore(start.endOf("week")) || d.isSame(start.endOf("week"), "day"); d = d.add(1, "day"))
    cols.push(d);

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        {cols.map((d) => (
          <Box
            key={d.toString()}
            sx={{
              flex: 1,
              bgcolor: "#fff",
              border: "1px solid #e5eefc",
              borderRadius: 1.5,
              p: 1,
              minHeight: 240,
              opacity: d.isBefore(today, "day") ? 0.5 : 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, color: BLUE_DARK, fontWeight: 700 }}>
              {d.format("dd, DD.MM")}
            </Typography>
            <Box sx={{ overflowY: "auto" }}>
              <Stack spacing={0.75}>
                {(eventsByDate.get(toYMD(d)) ?? []).map((e) => <EventBand key={e.id} e={e} />)}
                {(eventsByDate.get(toYMD(d)) ?? []).length === 0 && (
                  <Typography variant="caption" color="text.secondary">Нет событий</Typography>
                )}
              </Stack>
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function DayView({
  day,
  today,
  eventsByDate,
}: {
  day: Dayjs;
  today: Dayjs;
  eventsByDate: Map<string, CalEvent[]>;
}) {
  const list = eventsByDate.get(toYMD(day)) ?? [];
  return (
    <Box
      sx={{
        bgcolor: "#fff",
        border: "1px solid #e5eefc",
        borderRadius: 1.5,
        p: 2,
        opacity: day.isBefore(today, "day") ? 0.5 : 1,
      }}
    >
      <Typography variant="h6" sx={{ mb: 1, color: BLUE_DARK }}>
        {day.format("dddd, DD MMMM YYYY")}
      </Typography>
      <Divider sx={{ mb: 1 }} />
      <Stack spacing={0.75}>
        {list.map((e) => <EventBand key={e.id} e={e} />)}
        {list.length === 0 && (
          <Typography variant="body2" color="text.secondary">На этот день событий нет</Typography>
        )}
      </Stack>
    </Box>
  );
}

/* ===================== Виджеты событий ===================== */

// Плашка на всю ширину ~1 см высотой, одинаковая для обоих типов
function EventBand({ e }: { e: CalEvent }) {
  const palette = e.kind === "birthday" ? EVENT_COLORS.birthday : EVENT_COLORS.meet;
  const leftDot = <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: palette.dot, flex: "0 0 auto" }} />;

  const title =
    e.kind === "birthday"
      ? `🎂 ${e.title}`
      : `${e.time ?? ""}${e.time ? " • " : ""}Google Meet — ${e.title}`;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1,
        height: 38,               // ~1 см
        borderRadius: 1,
        bgcolor: palette.bg,
        color: palette.fg,
        border: `1px solid ${palette.dot}`,
        overflow: "hidden",
      }}
      title={`${e.subtitle ?? ""}${e.link ? " • ссылка" : ""}`}
    >
      {leftDot}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {title}
        </Typography>
        {e.kind === "meet" && e.link && (
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            <a href={e.link} target="_blank" rel="noopener noreferrer">ссылка</a>
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/* ===================== SX helpers ===================== */
function chipSx(active: boolean) {
  return {
    bgcolor: active ? BLUE : "#fff",
    color: active ? "#fff" : BLUE_DARK,
    borderColor: active ? BLUE : "#cfe0ff",
    "& .MuiChip-icon": { color: active ? "#fff" : BLUE_DARK },
    fontWeight: active ? 700 : 500,
  } as const;
}
const navBtnSx = {
  bgcolor: BLUE_DARK,
  color: "#fff",
  "&:hover": { bgcolor: "#111827" },
  width: 36,
  height: 36,
  borderRadius: "50%",
} as const;