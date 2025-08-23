import { useState, forwardRef, type Ref, type ReactElement } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Slide, Box, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
import { HR_STATUS_OPTIONS } from "src/config/statusConfig";
import { DEPARTMENTS } from "src/config/departmentConfig";
import { POSITION_OPTIONS } from "src/config/positionConfig";
import { useCreateCandidateMutation } from "src/api/candidatesApi";
import { useCreateEmployeeMutation } from "src/api/employeesApi";

const Transition = forwardRef(function Transition(
  props: SlideProps & { children: ReactElement },
  ref: Ref<unknown>
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

const Dot = ({ color }: { color: string }) => (
  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, marginRight: 8 }} />
);

type Props = { open: boolean; onClose: () => void; mode?: "candidate" | "employee" };

export default function CandidateDialog({ open, onClose, mode = "candidate" }: Props) {
  const isEmployee = mode === "employee";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"not_held" | "reserve" | "success" | "declined" | "canceled">("reserve"); // 👈 по умолчанию “в процессе”
  const [department, setDepartment] = useState(DEPARTMENTS[0].value);
  const [position, setPosition] = useState("");
  const [notes, setNotes] = useState("");
  const [birthday, setBirthday] = useState<Dayjs | null>(null);

  const [createCandidate, { isLoading: isCreatingCandidate }] = useCreateCandidateMutation();
  const [createEmployee, { isLoading: isCreatingEmployee }] = useCreateEmployeeMutation();

  const handleSubmit = async () => {
    if (!fullName || !email) return;

    if (isEmployee) {
      await createEmployee({
        fullName,
        email,
        phone: phone || undefined,
        department,
        position: position ? position : null,
        notes,
        birthdayAt: birthday ? birthday.startOf("day").toISOString() : null,
      }).unwrap();
    } else {
      const nowISO = new Date().toISOString();
      const body: any = {
        fullName,
        email,
        phone: phone || undefined,
        status,            
        department,
        position: position || undefined,
        notes,
      };
      if (status === "reserve") {
        body.polygraphAt = nowISO; 
      }
      await createCandidate(body).unwrap();
    }

    // reset
    setFullName(""); setPhone(""); setEmail("");
    setStatus("reserve"); setDepartment(DEPARTMENTS[0].value);
    setPosition(""); setNotes(""); setBirthday(null);
    onClose();
  };

  const busy = isEmployee ? isCreatingEmployee : isCreatingCandidate;

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      onClose={onClose}
      keepMounted
      scroll="paper"
      sx={{
        "& .MuiDialog-container": {
          justifyContent: "flex-end",
          alignItems: "stretch",
        },
      }}
      PaperProps={{
        sx: {
          width: { xs: "100vw", sm: 480 }, // 👈 фулл-ширина на мобиле
          maxWidth: "none",
          height: "100dvh",                // 👈 корректная высота на мобиле
          maxHeight: "100dvh",
          m: 0,
          borderRadius: 0,
          boxShadow: (t) => t.shadows[8],
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle>{isEmployee ? "Добавить сотрудника" : "Добавить кандидата"}</DialogTitle>

      <DialogContent
        dividers
        sx={{
          flex: 1,
          overflowY: "auto",
          pb: 10, // 👈 место под липкие кнопки
        }}
      >
        <Box display="grid" gap={2}>
          <TextField label="Полное имя" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
          <TextField label="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380XXXXXXXXX" />
          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />

          {!isEmployee && (
            <FormControl>
              <InputLabel id="status-label">Статус</InputLabel>
              <Select
                labelId="status-label"
                value={status}
                label="Статус"
                onChange={(e) => setStatus(e.target.value as any)}
              >
                {HR_STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    <Dot color={o.dot} />
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl>
            <InputLabel id="dept-label">Отдел</InputLabel>
            <Select
              labelId="dept-label"
              value={department}
              label="Отдел"
              onChange={(e) => {
                setDepartment(e.target.value as any);
                setPosition("");
              }}
            >
              {DEPARTMENTS.map((d) => (
                <MenuItem key={d.value} value={d.value}>
                  <Dot color={d.dot} />
                  {d.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel id="position-label">Должность</InputLabel>
            <Select
              labelId="position-label"
              value={position}
              label="Должность"
              onChange={(e) => setPosition(e.target.value as string)}
              displayEmpty
            >
              <MenuItem value="">
                <em>—</em>
              </MenuItem>
              {(POSITION_OPTIONS[department] || []).map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {isEmployee && (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Дата рождения"
                value={birthday}
                onChange={(v) => setBirthday(v)}
                format="DD.MM.YYYY"
                slotProps={{ textField: { size: "small" } as any }}
              />
            </LocalizationProvider>
          )}

          <TextField label="Заметки" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={3} />
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          position: "sticky",    
          bottom: 0,
          zIndex: 1,
          bgcolor: "background.paper",
          borderTop: 1,
          borderColor: "divider",
          px: 2,
          py: 1.5,
          pb: "calc(12px + env(safe-area-inset-bottom))", 
        }}
      >
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} disabled={busy || !fullName || !email} variant="contained">
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}