import { useState, forwardRef, type ReactElement, type Ref } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Slide, Box
} from "@mui/material";
import { useCreateCandidateMutation } from "src/api/candidatesApi";
import type { SlideProps } from "@mui/material/Slide";

const Transition = forwardRef(function Transition(
  props: SlideProps & { children: ReactElement },
  ref: Ref<unknown>
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CandidateDialog({ open, onClose }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [createCandidate, { isLoading }] = useCreateCandidateMutation();

  const canSubmit = fullName && email;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await createCandidate({ fullName, email, notes });
    setFullName("");
    setEmail("");
    setNotes("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      onClose={onClose}
      PaperProps={{ sx: { width: 480, ml: "auto", height: "100vh", borderRadius: 0 } }}
    >
      <DialogTitle>Добавить кандидата</DialogTitle>
      <DialogContent dividers>
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
        <Button onClick={handleSubmit} disabled={!canSubmit || isLoading} variant="contained">
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}