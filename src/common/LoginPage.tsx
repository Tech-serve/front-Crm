import { useState } from "react";
import { Alert, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "src/store/store";
import { loginByEmail } from "src/features/auth/authSlice";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      dispatch(loginByEmail(email));
      nav("/");
    } catch (e: any) {
      setErr(e.message || "Ошибка входа");
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" mb={2}>Вход</Typography>
      <Stack component="form" onSubmit={submit} spacing={2}>
        <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        {err && <Alert severity="error">{err}</Alert>}
        <Button type="submit" variant="contained">Войти</Button>
      </Stack>
    </Paper>
  );
}