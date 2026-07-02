import { z } from 'zod';

// Sanitize helper — strip HTML tags
function sanitize(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

export const contactSchema = z.object({
  name:    z.string().min(2).max(100).transform(sanitize),
  email:   z.string().email().max(200),
  phone:   z.string().max(30).optional().transform(v => (v ? sanitize(v) : v)),
  message: z.string().min(10).max(2000).transform(sanitize),
  recaptchaToken: z.string().min(1),
});

export const quoteSchema = z.object({
  name:        z.string().min(2).max(100).transform(sanitize),
  email:       z.string().email().max(200),
  phone:       z.string().max(30).optional().transform(v => (v ? sanitize(v) : v)),
  company:     z.string().max(100).optional().transform(v => (v ? sanitize(v) : v)),
  service:     z.enum(['web-design', 'seo', 'branding', 'other']),
  budget:      z.enum(['under-1k', '1k-5k', '5k-10k', '10k+']).optional(),
  description: z.string().min(10).max(3000).transform(sanitize),
  recaptchaToken: z.string().min(1),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type QuoteInput   = z.infer<typeof quoteSchema>;
