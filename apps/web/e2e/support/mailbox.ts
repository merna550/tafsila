/** Reads the mails that local Supabase "sends" from its mail catcher (Mailpit, `[local_smtp]` in supabase/config.toml). */
import { expect } from "@playwright/test";

/** Address of the mail catcher's HTTP API. */
const MAILBOX_URL = process.env.MAILBOX_URL ?? "http://127.0.0.1:54324";

/** One mail in a search result. */
interface MailSummary {
  /** Id used to fetch the body. */
  readonly ID: string;
  /** Subject line. */
  readonly Subject: string;
}

/**
 * Fetches JSON from the mail catcher.
 *
 * @param path - API path.
 * @returns The parsed body.
 */
async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${MAILBOX_URL}${path}`);
  if (!response.ok) throw new Error(`Mail catcher answered ${response.status} for ${path}`);
  return (await response.json()) as T;
}

/**
 * Waits for a mail to an address whose subject contains a text, and returns the link to `/auth/confirm` inside it.
 * The link's host is the project's site URL, so only its path and query are returned; the test opens them on its own server.
 *
 * @param address - Recipient address.
 * @param subjectPart - Text the subject must contain (Arabic or English; the subject has both).
 * @returns The path and query of the confirm link, for example `/auth/confirm?token_hash=…&type=email`.
 */
export async function confirmLinkFor(address: string, subjectPart: string): Promise<string> {
  let found: MailSummary | undefined;
  await expect
    .poll(
      async () => {
        const query = encodeURIComponent("to:" + address);
        const result = await getJson<{ messages: MailSummary[] }>("/api/v1/search?query=" + query);
        found = result.messages.find((mail) => mail.Subject.includes(subjectPart));
        return found !== undefined;
      },
      { message: `a mail "${subjectPart}" to ${address}`, timeout: 30_000 },
    )
    .toBe(true);
  const mail = await getJson<{ Text: string }>(`/api/v1/message/${found?.ID}`);
  const match = /\/auth\/confirm\?token_hash=[\w-]+&type=\w+/.exec(mail.Text);
  if (!match) throw new Error(`No confirm link in the mail to ${address}`);
  return match[0];
}
