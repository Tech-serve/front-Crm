export type CreateMeetInput = {
  issueKey: string;
  summary?: string;
  candidateEmail: string;
  assigneeEmail?: string;
  reporterEmail?: string;
  companyEmails?: string;   
  interviewDate: string;  
};

export async function createMeetWebhook(input: CreateMeetInput, signal?: AbortSignal): Promise<string> {
  const base = import.meta.env.VITE_API_BASE;
  if (!base) throw new Error("VITE_API_BASE is not set");
  const url = `${base.replace(/\/$/, "")}/meet/webhook`;

  const resp = await fetch(url, {
    method: "POST",
    mode: "cors",
    credentials: "include",          
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
    keepalive: true,
  });

  const data: any = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(String(data?.error || data?.body || resp.statusText));

  const link = data?.meetLink;
  if (typeof link !== "string" || link.length < 8) throw new Error("Invalid response");
  return link;
}