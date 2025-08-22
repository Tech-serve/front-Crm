// EmployeeBirthdayCell.tsx
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { usePatchEmployeeMutation } from "src/api/employeesApi";
import type { Employee } from "src/types/employee";

export default function EmployeeBirthdayCell({ row }: { row: Employee }) {
  const [patch] = usePatchEmployeeMutation();
  const value = row.birthdayAt ? dayjs(row.birthdayAt) : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={value}
        onChange={async (val) => {
          const iso = val ? val.startOf("day").toISOString() : null;
          await patch({ id: row._id, body: { birthdayAt: iso ?? null } }).unwrap();
        }}
        format="DD.MM.YYYY"
        slotProps={{
          textField: {
            size: "small",
            sx: {
              width: 120,
              mx: "auto",             
              "& input": { textAlign: "center" },
            },
          } as any,
        }}
      />
    </LocalizationProvider>
  );
}