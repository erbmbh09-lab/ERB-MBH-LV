import { z } from 'zod';

export const clientSchema = z.object({
  id: z.number(),
  classification: z.enum(['موكل', 'خصم']),
  nameAr: z.string().min(2, 'Arabic name must be at least 2 characters'),
  nameEn: z.string().min(2, 'English name must be at least 2 characters'),
  nationality: z.string().optional(),
  emiratesId: z.string().optional(),
  passportNo: z.string().optional(),
  phone1: z.string().min(9, 'Phone number must be at least 9 digits'),
  phone2: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  address: z.string().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  loginEnabled: z.boolean()
});

export const clientUpdateSchema = clientSchema.partial().omit({ id: true });

export type CreateClientInput = z.infer<typeof clientSchema>;
export type UpdateClientInput = z.infer<typeof clientUpdateSchema>;