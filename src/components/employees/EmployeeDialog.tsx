import { useState, forwardRef, type Ref, type ReactElement } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Slide, Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import type { SlideProps } from "@mui/material/Slide";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { DEPARTMENTS } from "src/config/departmentConfig";
import { POSITION_OPTIONS } from "src/config/positionConfig";
import { useCreateEmployeeMutation } from "src/api/employeesApi";

const Transition = forwardRef(function Transition(props: SlideProps & { children: ReactElement }, ref: Ref<unknown>) {
  return <Slide direction="left" ref={ref} {...props} />;
});

const Dot = ({ color }: { color: string }) => (
  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, marginRight: 8 }} />
);

type Props = { open: boolean; onClose: () => void };

export default function EmployeeDialog({ open, onClose }: Props) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0].value);
  const [position, setPosition] = useState("");
  const [notes, setNotes] = useState("");
  const [birthdayAt, setBirthdayAt] = useState<Dayjs | null>(null);
  const [hiredAt, setHiredAt] = useState<Dayjs | null>(dayjs());

  const [createEmployee, { isLoading }] = useCreateEmployeeMutation();

  const handleSubmit = async () => {
    if (!fullName || !email) return;
    await createEmployee({
      fullName,
      email,
      phone: phone || undefined,
      department,
      position: position || undefined,
      notes,
      birthdayAt: birthdayAt ? birthdayAt.startOf("day").toISOString() : undefined,
      hiredAt: hiredAt ? hiredAt.startOf("day").toISOString() : undefined,
      active: true,
    } as any);
    setFullName("");
    setPhone("");
    setEmail("");
    setDepartment(DEPARTMENTS[0].value);
    setPosition("");
    setNotes("");
    setBirthdayAt(null);
    setHiredAt(dayjs());
    onClose();
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      onClose={onClose}
      keepMounted
      sx={{ "& .MuiDialog-container": { justifyContent: "flex-end", alignItems: "stretch" } }}
      PaperProps={{ sx: { width: 480, maxWidth: "none", height: "100vh", maxHeight: "100vh", m: 0, borderRadius: 0, boxShadow: (t) => t.shadows[8], display: "flex", flexDirection: "column" } }}
    >
      <DialogTitle>Добавить сотрудника</DialogTitle>
      <DialogContent dividers sx={{ flex: 1, overflowY: "auto" }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box display="grid" gap={2}>
            <TextField label="Полное имя" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
            <TextField label="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380XXXXXXXXX" />
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
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
            <DatePicker label="День рождения" value={birthdayAt} onChange={setBirthdayAt} slotProps={{ textField: { fullWidth: true } }} />
            <DatePicker label="Дата приема" value={hiredAt} onChange={setHiredAt} slotProps={{ textField: { fullWidth: true } }} />
            <TextField label="Заметки" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={3} />
          </Box>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} disabled={isLoading || !fullName || !email} variant="contained">
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}