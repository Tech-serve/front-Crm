import { useEffect, useMemo, useState } from "react";
import type { Candidate } from "src/types/domain";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Box, Stack, Typography, Link, FormControlLabel, Checkbox,
  Backdrop, CircularProgress, IconButton
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
import EditCalendarOutlinedIcon from "@mui/icons-material/EditCalendarOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { createMeetWebhook } from "src/api/meetWebhook";
import { usePatchCandidateMutation, useDeleteCandidateMeetMutation } from "src/api/candidatesApi";

type Props = { row: Candidate; url?: string };

function shortMeet(u: string) {
  try {
    const { hostname, pathname } = new URL(u);
    const last = pathname.split("/").filter(Boolean).pop() || "";
    return `${hostname}/${last}`;
  } catch { return u; }
}

function toLocalInputValue(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toIsoFromLocalInput(v: string) {
  if (!v) return new Date().toISOString();
  const d = new Date(v);
  return d.toISOString();
}

export default function MidCell({ row, url }: Props) {
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [summary, setSummary] = useState("Собеседование");
  const [emails, setEmails] = useState(row.email || "");
  const [dt, setDt] = useState<string>(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const headIv = row.interviews?.[0];
  const [editSummary, setEditSummary] = useState(headIv?.notes || "Собеседование");
  const [editEmails, setEditEmails] = useState<string>(headIv?.participants?.join(", ") || row.email || "");

  const [localScheduledAt, setLocalScheduledAt] = useState<string | undefined>(
    headIv?.scheduledAt ? String(headIv.scheduledAt) : undefined
  );
  const [editDt, setEditDt] = useState<string>(toLocalInputValue(localScheduledAt || headIv?.scheduledAt));
  const [updateMeet, setUpdateMeet] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [localUrl, setLocalUrl] = useState<string | undefined>(undefined);
  const finalUrl = useMemo(() => localUrl || url, [localUrl, url]);

  const [patchCandidate] = usePatchCandidateMutation();
  const [deleteCandidateMeet] = useDeleteCandidateMeetMutation();

  useEffect(() => {
    const latestHead = row.interviews?.[0];
    const nextIso = latestHead?.scheduledAt ? String(latestHead.scheduledAt) : undefined;
    setLocalScheduledAt(nextIso);
    setEditSummary(latestHead?.notes || "Собеседование");
    setEditEmails(latestHead?.participants?.join(", ") || row.email || "");
    setEditDt(toLocalInputValue(nextIso));
    setLocalUrl(url);
  }, [row._id, row.updatedAt, url, row.email, row.interviews]);

  const scheduledLabel = useMemo(() => {
    const iso = localScheduledAt || (headIv?.scheduledAt as any);
    if (!iso) return "";
    return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  }, [localScheduledAt, headIv?.scheduledAt]);

  async function handleCreate() {
    setLoading(true);
    setErr(null);
    try {
      const list = emails.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
      const valids = Array.from(new Set(list.filter((e) => emailRe.test(e))));
      const candidateEmail = emailRe.test(row.email || "") ? row.email! : valids[0];
      if (!candidateEmail) throw new Error("Укажите хотя бы один email");

      const companyEmails = valids.join(",");
      const iso = toIsoFromLocalInput(dt);
      const issueKey = `CRM-${row._id ?? Math.random().toString(36).slice(2, 10)}`;

      const meetLink = await createMeetWebhook({
        issueKey,
        summary,
        candidateEmail,
        assigneeEmail: "",
        reporterEmail: "",
        companyEmails,
        interviewDate: iso,
      });

      setLocalUrl(meetLink);
      setLocalScheduledAt(iso);

      if (row._id) {
        const nextIv = {
          scheduledAt: iso,
          durationMinutes: 60,
          participants: valids,
          meetLink,
          status: "not_held" as const,
          source: "crm" as const,
          notes: summary,
        };
        const prev = Array.isArray(row.interviews) ? row.interviews : [];
        await patchCandidate({ id: row._id, body: { meetLink, interviews: [nextIv as any, ...prev] } }).unwrap();
      }

      setOpenCreate(false);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally { setLoading(false); }
  }

  async function handleEdit() {
    if (!row._id) return;
    setLoading(true);
    setErr(null);
    try {
      const list = editEmails.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
      const valids = Array.from(new Set(list.filter((e) => emailRe.test(e))));
      const iso = toIsoFromLocalInput(editDt);
      const issueKey = `CRM-${row._id ?? Math.random().toString(36).slice(2, 10)}`;

      let nextLink = finalUrl;
      if (updateMeet) {
        const candidateEmail = emailRe.test(row.email || "") ? row.email! : (valids[0] || "");
        const companyEmails = valids.join(",");
        if (!candidateEmail) throw new Error("Укажите хотя бы один email");
        nextLink = await createMeetWebhook({
          issueKey,
          summary: editSummary,
          candidateEmail,
          assigneeEmail: "",
          reporterEmail: "",
          companyEmails,
          interviewDate: iso,
        });
        setLocalUrl(nextLink);
      }

      const current = headIv || {};
      const nextHead: any = {
        scheduledAt: iso,
        durationMinutes: (current as any).durationMinutes ?? 60,
        participants: valids,
        status: (current as any).status ?? "not_held",
        source: (current as any).source ?? "crm",
        notes: editSummary,
      };
      if (nextLink) nextHead.meetLink = nextLink;

      const tail = (row.interviews || []).slice(1);
      await patchCandidate({ id: row._id, body: { meetLink: nextLink ?? undefined, interviews: [nextHead, ...tail] } }).unwrap();

      setLocalScheduledAt(iso);
      setOpenEdit(false);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally { setLoading(false); }
  }

  async function handleDeleteLink() {
    if (!row._id) return;
    setLoading(true);
    setErr(null);
    try {
      await deleteCandidateMeet(row._id).unwrap();
      setLocalUrl(undefined);
      setLocalScheduledAt(undefined);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally { setLoading(false); }
  }

  if (finalUrl) {
    return (
      <>
        <Backdrop open={loading} sx={(t) => ({ zIndex: t.zIndex.modal + 1, color: "#fff" })}>
          <CircularProgress />
        </Backdrop>

        <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
          <Link
            href={finalUrl}
            target="_blank"
            rel="noopener noreferrer"
            underline="none"
            sx={(t) => ({
              px: 1, py: 0.5, borderRadius: 2, fontWeight: 700, lineHeight: 1.2, minWidth: 0, maxWidth: "100%",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              color: t.palette.primary.main,
              backgroundColor: alpha(t.palette.primary.main, 0.12),
              border: `1px solid ${alpha(t.palette.primary.main, 0.25)}`,
              "&:hover": { backgroundColor: alpha(t.palette.primary.main, 0.2) },
              flexShrink: 1,
            })}
          >
            {shortMeet(finalUrl)}
          </Link>

          {scheduledLabel ? (
            <Typography variant="caption" noWrap sx={{ fontWeight: 800, flexShrink: 0 }}>
              {scheduledLabel}
            </Typography>
          ) : null}

          <IconButton size="small" color="error" onClick={handleDeleteLink} disabled={loading} sx={{ ml: 0.5, flexShrink: 0 }}>
            <DeleteOutlineOutlinedIcon fontSize="small" />
          </IconButton>

          <Button
            size="small"
            startIcon={loading ? <CircularProgress size={16} thickness={5} /> : <EditCalendarOutlinedIcon />}
            disabled={loading}
            onClick={() => {
              const latestHead = row.interviews?.[0];
              setEditSummary(latestHead?.notes || "Собеседование");
              setEditEmails(latestHead?.participants?.join(", ") || row.email || "");
              setEditDt(toLocalInputValue(localScheduledAt || latestHead?.scheduledAt) || toLocalInputValue(new Date().toISOString()));
              setUpdateMeet(false);
              setOpenEdit(true);
            }}
            sx={(t) => ({
              ml: "auto",
              fontWeight: 800,
              borderRadius: 2,
              px: 1.25,
              backgroundColor: alpha(t.palette.primary.main, 0.08),
              color: t.palette.primary.main,
              border: `1px solid ${alpha(t.palette.primary.main, 0.2)}`,
              boxShadow: "none",
              "&:hover": { backgroundColor: alpha(t.palette.primary.main, 0.16), boxShadow: "none" },
              flexShrink: 0,
              whiteSpace: "nowrap",
            })}
          >
            новый
          </Button>
        </Box>

        <Dialog open={openEdit} onClose={() => !loading && setOpenEdit(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Перепланировать</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="Тема" value={editSummary} onChange={(e) => setEditSummary(e.target.value)} fullWidth />
              <TextField label="Участники (email, через запятую)" value={editEmails} onChange={(e) => setEditEmails(e.target.value)} fullWidth />
              <TextField type="datetime-local" label="Новая дата и время" value={editDt} onChange={(e) => setEditDt(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
              <FormControlLabel control={<Checkbox checked={updateMeet} onChange={(e) => setUpdateMeet(e.target.checked)} />} label="Обновить событие в Meet" />
              {err && <Typography color="error" variant="body2">{err}</Typography>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEdit(false)} disabled={loading}>Отмена</Button>
            <Button
              onClick={handleEdit}
              disabled={loading}
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} thickness={5} /> : <EditCalendarOutlinedIcon />}
              sx={(t) => ({
                backgroundColor: alpha(t.palette.primary.main, 0.15),
                color: t.palette.primary.main,
                border: `1px solid ${alpha(t.palette.primary.main, 0.25)}`,
                boxShadow: "none",
                "&:hover": { backgroundColor: alpha(t.palette.primary.main, 0.25), boxShadow: "none" },
              })}
            >
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Backdrop open={loading} sx={(t) => ({ zIndex: t.zIndex.modal + 1, color: "#fff" })}>
        <CircularProgress />
      </Backdrop>

      <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Button
          size="small"
          startIcon={loading ? <CircularProgress size={16} thickness={5} /> : <PhoneInTalkOutlinedIcon />}
          disabled={loading}
          onClick={() => setOpenCreate(true)}
          sx={(t) => ({
            fontWeight: 800,
            borderRadius: 2,
            px: 2.5,
            backgroundColor: alpha(t.palette.primary.main, 0.12),
            color: t.palette.primary.main,
            border: `1px solid ${alpha(t.palette.primary.main, 0.25)}`,
            boxShadow: "none",
            backdropFilter: "saturate(1.2) blur(2px)",
            "&:hover": { backgroundColor: alpha(t.palette.primary.main, 0.2), boxShadow: "none" },
            textTransform: "uppercase",
          })}
        >
          СОЗДАТЬ
        </Button>
      </Box>

      <Dialog open={openCreate} onClose={() => !loading && setOpenCreate(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Создать событие MID</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Тема" value={summary} onChange={(e) => setSummary(e.target.value)} fullWidth />
            <TextField label="Участники (email, через запятую)" value={emails} onChange={(e) => setEmails(e.target.value)} fullWidth />
            <TextField type="datetime-local" label="Дата и время" value={dt} onChange={(e) => setDt(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
            {err && <Typography color="error" variant="body2">{err}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)} disabled={loading}>Отмена</Button>
          <Button
            onClick={handleCreate}
            disabled={loading}
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} thickness={5} /> : <PhoneInTalkOutlinedIcon />}
            sx={(t) => ({
              backgroundColor: alpha(t.palette.primary.main, 0.15),
              color: t.palette.primary.main,
              border: `1px solid ${alpha(t.palette.primary.main, 0.25)}`,
              boxShadow: "none",
              "&:hover": { backgroundColor: alpha(t.palette.primary.main, 0.25), boxShadow: "none" },
            })}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}