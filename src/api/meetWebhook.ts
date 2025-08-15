// frontend/src/api/meetWebhook.ts
const WEBHOOK_URL =
  import.meta.env.VITE_MEET_WEBHOOK_URL || `${import.meta.env.VITE_API_BASE}/webhook`;

export type MeetWebhookPayload = {
  issueKey: string;
  summary: string;
  candidateEmail: string;
  assigneeEmail: string;
  reporterEmail: string;
  companyEmails: string;
  interviewDate: string;
};

export async function createMeetWebhook(p: MeetWebhookPayload): Promise<string> {
  const r = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(t || `HTTP ${r.status}`);
  }
  const json = await r.json();
  if (!json?.meetLink) throw new Error("No meetLink");
  return String(json.meetLink);
}