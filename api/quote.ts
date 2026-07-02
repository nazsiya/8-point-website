import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resend } from '../lib/resend';
import { quoteSchema } from '../lib/validate';
import { verifyRecaptcha } from '../lib/recaptcha';
import { AdminNotification } from '../emails/AdminNotification';
import { renderAsync } from '@react-email/components';
import * as React from 'react';
import Busboy from 'busboy';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

interface ParsedFile {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
}

interface ParsedMultipart {
  fields: Record<string, string>;
  file?: ParsedFile;
  error?: string;
}

const ALLOWED_EXTENSIONS = ['dwg', 'dxf', 'step', 'stp', 'iges', 'igs', 'pdf', 'jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/octet-stream',
  'application/x-octet-stream',
  'text/plain',
  // Specific CAD MIME types:
  'application/acad',
  'image/vnd.dwg',
  'image/x-dwg',
  'application/dwg',
  'application/x-dwg',
  'application/x-autocad',
  'image/autocad',
  'image/x-autocad',
  'application/dxf',
  'application/x-dxf',
  'image/vnd.dxf',
  'image/x-dxf',
  'text/x-dxf',
  'application/step',
  'application/x-step',
  'application/iges',
  'application/x-iges',
];

function parseMultipartRequest(req: VercelRequest): Promise<ParsedMultipart> {
  return new Promise((resolve) => {
    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: 4 * 1024 * 1024, // 4MB limit
        files: 1,
      },
    });

    const fields: Record<string, string> = {};
    let fileBuffer: Buffer | null = null;
    let fileName = '';
    let fileMimeType = '';
    let fileSize = 0;
    let fileValidationError = '';

    busboy.on('file', (_fieldname, file, info) => {
      const { filename, mimeType } = info;
      fileName = filename;
      fileMimeType = mimeType;

      const chunks: Buffer[] = [];
      file.on('data', (data: Buffer) => {
        chunks.push(data);
        fileSize += data.length;
        if (fileSize > 4 * 1024 * 1024) {
          fileValidationError = 'File exceeds the 4MB limit.';
        }
      });

      file.on('end', () => {
        if (!fileValidationError) {
          fileBuffer = Buffer.concat(chunks);
        }
      });
    });

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on('error', (err: any) => {
      resolve({ fields, error: err.message || 'Error parsing form data.' });
    });

    busboy.on('finish', () => {
      if (fileValidationError) {
        resolve({ fields, error: fileValidationError });
      } else if (fileBuffer && fileName) {
        resolve({
          fields,
          file: {
            filename: fileName,
            buffer: fileBuffer,
            mimeType: fileMimeType,
            size: fileSize,
          },
        });
      } else {
        resolve({ fields });
      }
    });

    req.pipe(busboy);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).json({ success: true });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? (req.socket.remoteAddress ?? 'unknown');
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a few minutes.' });
  }

  // Parse multipart form
  const parsedMultipart = await parseMultipartRequest(req);
  if (parsedMultipart.error) {
    return res.status(400).json({ error: parsedMultipart.error });
  }

  const { fields, file } = parsedMultipart;

  // Validate fields with Zod
  const parsedFields = quoteSchema.safeParse(fields);
  if (!parsedFields.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsedFields.error.flatten() });
  }

  const {
    projectName, serviceCategory, scopeOfWork, materialType, estimatedWeight,
    desiredDeadline, name, company, email, phone, recaptchaToken,
  } = parsedFields.data;

  // Validate file if present
  if (file) {
    // Validate file size (already enforced by parser, but good for defense in depth)
    if (file.size > 4 * 1024 * 1024) {
      return res.status(413).json({ error: 'File size exceeds the 4MB limit.' });
    }

    // Validate extension
    const ext = file.filename.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({ error: `File type .${ext || ''} is not allowed.` });
    }

    // Validate MIME type
    const mime = file.mimeType.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mime)) {
      return res.status(400).json({ error: `File MIME type '${file.mimeType}' is not allowed.` });
    }
  }

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
        type: 'quote',
        fields: {
          name, email, phone, company, projectName, serviceCategory,
          scopeOfWork, materialType, estimatedWeight, desiredDeadline,
        },
      })
    );

    const emailPayload: any = {
      from: fromEmail,
      to: adminEmail,
      reply_to: email,
      subject: `New Quote Request from ${name} — ${serviceCategory}`,
      html: adminHtml,
    };

    if (file) {
      emailPayload.attachments = [
        {
          filename: file.filename,
          content: file.buffer.toString('base64'),
        },
      ];
    }

    await resend.emails.send(emailPayload);

    return res.status(200).json({ success: true, message: 'Quote request sent successfully!' });
  } catch (err: any) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
}
