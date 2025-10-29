import { Resend } from 'resend';

let resend: Resend | null = null;

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set. Add it to your .env file.');
  }
  if (!resend) {
    resend = new Resend(apiKey);
  }
  return resend;
}

export interface SendEmailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ from, to, subject, html }: SendEmailOptions) {
  const client = getClient();
  const fromAddress = from || process.env.RESEND_FROM || 'onboarding@resend.dev';
  try {
    const result = await client.emails.send({ from: fromAddress, to, subject, html });
    return result;
  } catch (error) {
    throw error;
  }
}
