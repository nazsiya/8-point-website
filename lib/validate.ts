import { z } from 'zod';

// Sanitize helper — strip HTML tags
function sanitize(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

export const contactSchema = z.object({
  name:        z.string().min(2).max(100).transform(sanitize),
  email:       z.string().email().max(200),
  company:     z.string().max(100).optional().transform(v => (v ? sanitize(v) : v)),
  inquiryType: z.enum([
    'Electrical Instrumentation & Services',
    'Piping Services',
    'Industrial Solutions',
    'Insulation & Cladding',
    'Other',
  ]),
  message: z.string().min(10).max(2000).transform(sanitize),
  recaptchaToken: z.string().min(1),
});

export const quoteSchema = z.object({
  projectName: z.string().min(2).max(150).transform(sanitize),
  serviceCategory: z.enum([
    'Industrial Insulation',
    'Mechanical Piping',
    'Structural Fabrication',
    'Maritime Maintenance',
    'Refinery Services',
  ]),
  scopeOfWork: z.string().min(10).max(3000).transform(sanitize),
  materialType: z.string().max(100).optional().transform(v => (v ? sanitize(v) : v)),
  estimatedWeight: z.string().max(50).optional().transform(v => (v ? sanitize(v) : v)),
  desiredDeadline: z.string().max(50).optional(),
  name:    z.string().min(2).max(100).transform(sanitize),
  company: z.string().max(100).optional().transform(v => (v ? sanitize(v) : v)),
  email:   z.string().email().max(200),
  phone:   z.string().max(30).optional().transform(v => (v ? sanitize(v) : v)),
  recaptchaToken: z.string().min(1),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type QuoteInput   = z.infer<typeof quoteSchema>;
