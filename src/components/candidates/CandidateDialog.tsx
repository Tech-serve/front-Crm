import { useState, forwardRef, type Ref, type ReactElement } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Slide,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material"
import type { SlideProps } from "@mui/material/Slide"
import { HR_STATUS_OPTIONS } from "src/config/statusConfig"
import { DEPARTMENTS } from "src/config/departmentConfig"
import { POSITION_OPTIONS } from "src/config/positionConfig"   // ← добавлено
import { useCreateCandidateMutation } from "src/api/candidatesApi"

const Transition = forwardRef(function Transition(
  props: SlideProps & { children: ReactElement },
  ref: Ref<unknown>
) {
  return <Slide direction="left" ref={ref} {...props} />
})

const Dot = ({ color }: { color: string }) => (
  <span
    style={{
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: color,
      marginRight: 8
    }}
  />
)

type Props = { open: boolean; onClose: () => void }

export default function CandidateDialog({ open, onClose }: Props) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState("not_held")
  const [department, setDepartment] = useState(DEPARTMENTS[0].value)
  const [position, setPosition] = useState("")                 // ← добавлено
  const [notes, setNotes] = useState("")

  const [createCandidate, { isLoading }] = useCreateCandidateMutation()

  const handleSubmit = async () => {
    if (!fullName || !email) return
    await createCandidate({
      fullName,
      email,
      status,
      department,
      position: position || undefined,                          // ← добавлено
      notes
    })
    setFullName("")
    setEmail("")
    setStatus("not_held")
    setDepartment(DEPARTMENTS[0].value)
    setPosition("")                                             // ← добавлено
    setNotes("")
    onClose()
  }

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      onClose={onClose}
      keepMounted
      sx={{
        "& .MuiDialog-container": {
          justifyContent: "flex-end",
          alignItems: "stretch",
        },
      }}
      PaperProps={{
        sx: {
          width: 480,
          maxWidth: "none",
          height: "100vh",
          maxHeight: "100vh",     // переopпределяет calc(100% - 64px)
          m: 0,                   // без внешних отступов
          borderRadius: 0,
          boxShadow: (t) => t.shadows[8],
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle>Добавить кандидата</DialogTitle>
      <DialogContent dividers sx={{ flex: 1, overflowY: "auto" }}>
        <Box display="grid" gap={2}>
          <TextField
            label="Полное имя"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoFocus
          />
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />

          <FormControl>
            <InputLabel id="status-label">Статус</InputLabel>
            <Select
              labelId="status-label"
              value={status}
              label="Статус"
              onChange={(e) => setStatus(e.target.value as string)}
            >
              {HR_STATUS_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  <Dot color={o.dot} />
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel id="dept-label">Отдел</InputLabel>
            <Select
              labelId="dept-label"
              value={department}
              label="Отдел"
              onChange={(e) => {
                setDepartment(e.target.value as any)
                setPosition("")                                   // ← сброс должности при смене отдела
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

          {/* Точно такой же Select-вид, НО без цветных точек */}
          <FormControl>
            <InputLabel id="position-label">Position</InputLabel>
            <Select
              labelId="position-label"
              value={position}
              label="Position"
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

          <TextField
            label="Заметки"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !fullName || !email}
          variant="contained"
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  )
}