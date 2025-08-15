// frontend/src/tables/cells/MidCell.tsx
import { useMemo, useState } from "react";
import type { Candidate } from "src/types/domain";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Stack,
  Typography,
  Link,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
import { createMeetWebhook } from "src/api/meetWebhook";
import { usePatchCandidateMutation } from "src/api/candidatesApi";

type Props = { row: Candidate; url?: string };

function shortMeet(u: string) {
  try {
    const { hostname, pathname } = new URL(u);
    const last = pathname.split("/").filter(Boolean).pop() || "";
    return `${hostname}/${last}`;
  } catch {
    return u;
  }
}

export default function MidCell({ row, url }: Props) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("Интервью");
  const [emails, setEmails] = useState(row.email || "");
  const [dt, setDt] = useState<string>(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState<string | undefined>(undefined);
  const finalUrl = useMemo(() => localUrl || url, [localUrl, url]);
  const [patchCandidate] = usePatchCandidateMutation();

  const scheduledAtISO =
    row.interviews && row.interviews.length > 0 ? row.interviews[0]?.scheduledAt : undefined;

  const scheduledLabel = useMemo(() => {
    if (!scheduledAtISO) return "";
    const d = new Date(scheduledAtISO as any);
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
  }, [scheduledAtISO]);

  async function handleCreate() {
    setLoading(true);
    setErr(null);
    try {
      const list = emails.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
      const valids = Array.from(new Set(list.filter((e) => emailRe.test(e))));
      if (valids.length === 0 && !emailRe.test(row.email || "")) throw new Error("Укажите хотя бы один email");

      const candidateEmail = emailRe.test(row.email || "") ? row.email! : valids[0];
      const companyEmails = valids.join(",");

      const local = new Date(dt);
      const iso = new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();

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
        await patchCandidate({
          id: row._id,
          body: { meetLink, interviews: [nextIv as any, ...prev] },
        }).unwrap();
      }

      setOpen(false);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  if (finalUrl) {
    return (
      <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Stack spacing={0.5} sx={{ alignItems: "center", maxWidth: "100%" }}>
          <Link
            href={finalUrl}
            target="_blank"
            rel="noopener noreferrer"
            underline="none"
            sx={(t) => ({
              px: 1.25,
              py: 0.5,
              borderRadius: 2,
              fontWeight: 700,
              lineHeight: 1.2,
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: t.palette.primary.main,
              backgroundColor: alpha(t.palette.primary.main, 0.12),
              border: `1px solid ${alpha(t.palette.primary.main, 0.25)}`,
              "&:hover": { backgroundColor: alpha(t.palette.primary.main, 0.2) },
            })}
          >
            {shortMeet(finalUrl)}
          </Link>
          {scheduledLabel ? (
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {scheduledLabel}
            </Typography>
          ) : null}
        </Stack>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Button
          size="small"
          startIcon={<PhoneInTalkOutlinedIcon />}
          onClick={() => setOpen(true)}
          sx={(t) => ({
            fontWeight: 800,
            borderRadius: 2,
            px: 2.5,
            backgroundColor: alpha(t.palette.primary.main, 0.12),
            color: t.palette.primary.main,
            border: `1px solid ${alpha(t.palette.primary.main, 0.25)}`,
            boxShadow: "none",
            backdropFilter: "saturate(1.2) blur(2px)",
            "&:hover": {
              backgroundColor: alpha(t.palette.primary.main, 0.2),
              boxShadow: "none",
            },
            textTransform: "uppercase",
          })}
        >
          СОЗДАТЬ
        </Button>
      </Box>

      <Dialog open={open} onClose={() => !loading && setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Создать событие MID</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Тема" value={summary} onChange={(e) => setSummary(e.target.value)} fullWidth />
            <TextField
              label="Участники (email, через запятую)"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              fullWidth
            />
            <TextField
              type="datetime-local"
              label="Дата и время"
              value={dt}
              onChange={(e) => setDt(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            {err && (
              <Typography color="error" variant="body2">
                Webhook: {err}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            Отмена
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading}
            variant="contained"
            startIcon={<PhoneInTalkOutlinedIcon />}
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