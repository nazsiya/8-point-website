import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resend } from '../lib/resend';
import { contactSchema } from '../lib/validate';
import { verifyRecaptcha } from '../lib/recaptcha';
import { AdminNotification } from '../emails/AdminNotification';
import { renderAsync } from '@react-email/components';
import * as React from 'react';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? (req.socket.remoteAddress ?? 'unknown');
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a few minutes.' });
  }

  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { name, email, company, inquiryType, message, recaptchaToken } = parsed.data;

  try {
    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
      return res.status(400).json({ error: 'reCAPTCHA verification failed. Please try again.' });
    }
  } catch (err) {
    console.error('reCAPTCHA error:', err);
    return res.status(500).json({ error: 'reCAPTCHA verification error' });
  }

  const adminEmail = process.env.ADMIN_EMAIL!;
  const fromEmail  = process.env.FROM_EMAIL!;

  try {
    const adminHtml = await renderAsync(
      React.createElement(AdminNotification, {
        type: 'contact',
        fields: { name, email, company, inquiryType, message },
      })
    );

    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      reply_to: email,
      subject: `New Contact Message from ${name} — ${inquiryType}`,
      html: adminHtml,
    });

    return res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
}
