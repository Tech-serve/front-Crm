import { useRef, useState, useMemo } from "react";
import { Box, Button, IconButton, Tooltip } from "@mui/material"; // CHANGED: добавлены IconButton, Tooltip
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { usePatchEmployeeMutation } from "src/api/employeesApi";
import type { Employee } from "src/types/employee";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export default function EmployeeTerminatedCell({ row }: { row: Employee }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [patch] = usePatchEmployeeMutation();

  const value = useMemo(() => (row.terminatedAt ? dayjs(row.terminatedAt) : null), [row.terminatedAt]);

  const save = async (val: Dayjs | null) => {
    setOpen(false);
    const iso = val ? val.startOf("day").toISOString() : null; 
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

        {value && (
          <Tooltip title="Сбросить дату">
            <IconButton
              size="small"
              aria-label="Сбросить дату"
              onClick={() => save(null)}
              sx={{
                p: 0.25,         
                height: 22,      
                width: 22,   
                lineHeight: 1.1,
              }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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