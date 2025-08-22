import { useRef, useState, useMemo } from "react";
import { Box, Button } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { usePatchEmployeeMutation } from "src/api/employeesApi";
import type { Employee } from "src/types/employee";

export default function EmployeeTerminatedCell({ row }: { row: Employee }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [patch] = usePatchEmployeeMutation();

  const value = useMemo(() => (row.terminatedAt ? dayjs(row.terminatedAt) : null), [row.terminatedAt]);

  const save = async (val: Dayjs | null) => {
    setOpen(false);
    const iso = val ? val.startOf("day").toISOString() : null; // null = работает
    await patch({ id: row._id, body: { terminatedAt: iso } }).unwrap();
  };

  const label = value ? `УВОЛЕН: ${value.format("DD.MM.YYYY")}` : "РАБОТАЕТ";

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box ref={anchorRef} sx={{ width: "100%", display: "flex", alignItems: "center", gap: 0.5 }}>
        <Button
          size="small"
          variant={value ? "outlined" : "text"}
          onClick={() => setOpen(true)}
          sx={{
            fontSize: 12,
            textTransform: "none",
            minWidth: 0,
            px: value ? 0.75 : 0,
            py: 0,
            height: 22,
            lineHeight: 1.1,
            width: "100%",
            justifyContent: "flex-start",
          }}
        >
          {label}
        </Button>

        {/* быстрый сброс, если дата уже стоит */}
        {value && (
          <Button
            size="small"
            onClick={() => save(null)}
            sx={{ fontSize: 12, minWidth: 0, px: 0.5, py: 0, height: 22, lineHeight: 1.1 }}
          >
            Очистить
          </Button>
        )}

        <DatePicker
          value={value}
          onChange={save}
          open={open}
          onClose={() => setOpen(false)}
          slotProps={{
            popper: { anchorEl: anchorRef.current },
            textField: {
              sx: { position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" },
            } as any,
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}