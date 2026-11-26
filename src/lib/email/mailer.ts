import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { prisma } from "@/lib/db";

let transporter: Transporter | null | undefined;

export function emailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  if (!emailConfigured()) {
    transporter = null;
    return null;
  }
  const port = Number(process.env.SMTP_PORT || 465);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: (process.env.SMTP_SECURE ?? (port === 465 ? "true" : "false")) === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  return transporter;
}

export type EmailMessage = { to: string; subject: string; html: string; text: string; template: string };

/**
 * Sends an email. When SMTP is not configured the message is logged (status LOGGED)
 * so development and pre-launch environments keep working. Never throws — email
 * failures must not break checkout or order processing.
 */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  const t = getTransporter();
  let status = "LOGGED";
  let error: string | null = null;
  try {
    if (t) {
      await t.sendMail({
        from: process.env.EMAIL_FROM || "MALAKAND THREADS <malakantradesuae@gmail.com>",
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      });
      status = "SENT";
    } else if (process.env.NODE_ENV !== "test") {
      console.info(`[email:not-configured] to=${msg.to} subject="${msg.subject}" template=${msg.template}`);
    }
  } catch (e) {
    status = "FAILED";
    error = e instanceof Error ? e.message.slice(0, 480) : "unknown error";
    console.error("[email] send failed", error);
  }
  await prisma.emailLog
    .create({ data: { to: msg.to.slice(0, 191), subject: msg.subject.slice(0, 255), template: msg.template, status, error } })
    .catch(() => {});
  return status === "SENT";
}
