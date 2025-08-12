// src/tables/cells/WhenCell.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Typography, InputBase } from "@mui/material";
import { LocalizationProvider, DatePicker, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { usePatchCandidateMutation } from "src/api/candidatesApi";
import type { Candidate, InterviewStatus } from "src/types/domain";

const STATUS_TO_FIELD: Record<InterviewStatus, keyof Candidate | null> = {
  not_held: null,           // В процессе — показываем createdAt, без пикера
  reserve:  "polygraphAt",  // Полиграф (дата+время)
  success:  "acceptedAt",   // Принято (дата)
  declined: "declinedAt",   // Отказано (дата)
  canceled: "canceledAt",   // Отказался (дата)
};

type Props = { row: Candidate & { statusCode?: InterviewStatus | string } };

export default function WhenCell({ row }: Props) {
  const [open, setOpen] = useState(false);
  const topAnchorRef = useRef<HTMLDivElement | null>(null);
  const [patchCandidate] = usePatchCandidateMutation();

  const status = ((row as any).statusCode || row.status) as InterviewStatus | undefined;
  const field = status ? STATUS_TO_FIELD[status] ?? null : null;

  const iso = field ? ((row as any)[field] as string | undefined) : undefined;
  const value = useMemo(() => (iso ? dayjs(iso) : null), [iso]);

  const isPolygraph = status === "reserve";
  const isEditable = !!field;

  // адрес/заметка только для полиграфа
  const [polyAddr, setPolyAddr] = useState(row.polygraphAddress ?? "");
  useEffect(() => setPolyAddr(row.polygraphAddress ?? ""), [row.polygraphAddress]);

  // not_held → показываем createdAt без пикера
  if (status === "not_held") {
    const created = row.createdAt ? dayjs(row.createdAt) : null;
    return (
      <Typography variant="caption" sx={{ fontSize: 12, color: "text.secondary" }}>
        {created ? created.format("DD.MM.YYYY") : "—"}
      </Typography>
    );
  }

  const label =
    isPolygraph
      ? (value ? `ПОЛИГРАФ: ${value.format("DD.MM.YYYY HH:mm")}` : "ВЫБРАТЬ ПОЛИГРАФ")
      : (isEditable ? (value ? value.format("DD.MM.YYYY") : "ВЫБРАТЬ ДАТУ") : "—");

  const saveDate = async (val: Dayjs | null) => {
    setOpen(false);
    if (!field) return;

    const nextIso = val
      ? (isPolygraph ? val.second(0) : val.startOf("day")).toISOString()
      : null;

    try {
      await patchCandidate({ id: row._id, body: { [field]: nextIso } as any }).unwrap();
    } catch (e) {
      console.error(e);
    }
  };

  const savePolyAddr = async () => {
    if (!isPolygraph) return;
    try {
      await patchCandidate({
        id: row._id,
        body: { polygraphAddress: polyAddr || null } as any,
      }).unwrap();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          display: "grid",
          gridTemplateRows: isPolygraph ? "22px 22px" : "1fr",
          gap: isPolygraph ? 0.5 : 0,
          width: "100%",
          alignItems: "center",
        }}
      >
        {/* верхняя «половина» */}
        <Box ref={topAnchorRef} sx={{ width: "100%", height: 22, display: "flex", alignItems: "center" }}>
          {isEditable ? (
            <Button
              size="small"
              variant={isPolygraph ? "outlined" : "text"}
              onClick={() => setOpen(true)}
              sx={{
                fontSize: 12,
                textTransform: "none",
                minWidth: 0,
                px: isPolygraph ? 0.75 : 0,
                py: 0,
                height: 22,
                lineHeight: 1.1,
                width: "100%",
                justifyContent: "flex-start",
              }}
            >
              {label}
            </Button>
          ) : (
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 12 }}>—</Typography>
          )}
        </Box>

        {/* нижняя «половина» — только для Полиграфа */}
        {isPolygraph && (
          <InputBase
            value={polyAddr}
            onChange={(e) => setPolyAddr(e.target.value)}
            onBlur={savePolyAddr}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            placeholder="Адрес / заметка"
            sx={{
              fontSize: 12,
              height: 22,
              px: 0.75,
              border: "1px solid rgba(0,0,0,0.23)",
              borderRadius: 1,
              lineHeight: 1.1,
            }}
          />
        )}

        {/* попап под верхней половиной */}
        {isPolygraph ? (
          <DateTimePicker
            value={value}
            onChange={saveDate}
            open={open}
            onClose={() => setOpen(false)}
            ampm={false}
            minutesStep={5}
            slotProps={{
              popper: { anchorEl: topAnchorRef.current },
              textField: {
                sx: { position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" },
              },
            }}
          />
        ) : (
          <DatePicker
            value={value}
            onChange={saveDate}
            open={open}
            onClose={() => setOpen(false)}
            slotProps={{
              popper: { anchorEl: topAnchorRef.current },
              textField: {
                sx: { position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" },
              },
            }}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
}