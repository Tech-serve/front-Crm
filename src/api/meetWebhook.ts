// frontend/src/api/meetWebhook.ts
export type CreateMeetInput = {
  issueKey: string;
  summary: string;
  candidateEmail: string;
  assigneeEmail: string;
  reporterEmail: string;
  companyEmails: string;
  interviewDate: string;
};

export async function createMeetWebhook(input: CreateMeetInput): Promise<string> {
  const url = import.meta.env.VITE_MEET_WEBHOOK_URL as string;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data: any = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(String(data?.error || resp.statusText));

  const link = data?.meetLink || data?.link || data?.url;
  if (typeof link !== "string" || link.length < 8) throw new Error("Invalid response");
  return link;
}