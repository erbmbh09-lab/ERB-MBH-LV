import { z } from 'zod';

const emergencyContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  relationship: z.string(),
  phone: z.string().min(9, 'Phone number must be at least 9 digits')
});

const salaryDetailsSchema = z.object({
  basic: z.number(),
  housing: z.number(),
  transport: z.number(),
  other: z.number()
});

const workingHoursSchema = z.object({
  startTime: z.string(),
  endTime: z.string()
});

const lawyerLicenseSchema = z.object({
  expiry: z.string().optional(),
  reminderDays: z.number().optional()
});

export const employeeSchema = z.object({
  id: z.number(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.string(),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['ذكر', 'أنثى']).optional(),
  maritalStatus: z.string().optional(),
  mobilePhone: z.string().min(9, 'Mobile number must be at least 9 digits'),
  address: z.string().optional(),
  joinDate: z.string(),
  department: z.string().optional(),
  branch: z.enum(['دبي', 'الشارقة', 'عجمان']),
  contractType: z.enum(['كامل', 'جزئي']),
  contractEndDate: z.string().optional(),
  contractEndReminderDays: z.number().optional(),
  directManagerId: z.number().optional(),
  residencyStatus: z.string().optional(),
  proCardExpiry: z.string().optional(),
  proCardReminderDays: z.number().optional(),
  
  lawyerLicenses: z.object({
    dubai: lawyerLicenseSchema.optional(),
    sharjah: lawyerLicenseSchema.optional(),
    ajman: lawyerLicenseSchema.optional(),
    abuDhabi: lawyerLicenseSchema.optional()
  }).optional(),

  healthInfo: z.object({
    hasIssues: z.boolean().default(false),
    details: z.string().optional()
  }).optional(),

  emergencyContacts: z.array(emergencyContactSchema).optional(),

  documents: z.object({
    passport: z.object({
      number: z.string().optional(),
      expiry: z.string().optional(),
      reminderDays: z.number().optional()
    }).optional(),
    emiratesId: z.object({
      number: z.string().optional(),
      expiry: z.string().optional(),
      reminderDays: z.number().optional()
    }).optional(),
    workPermit: z.object({
      number: z.string().optional(),
      expiry: z.string().optional(),
      reminderDays: z.number().optional()
    }).optional(),
    healthInsurance: z.object({
      expiry: z.string().optional(),
      reminderDays: z.number().optional()
    }).optional()
  }).optional(),

  bankInfo: z.object({
    bankName: z.string().optional(),
    iban: z.string().optional(),
    accountNo: z.string().optional(),
    salaryPaymentMethod: z.enum(['wps', 'bank transfer', 'cash']).optional()
  }).optional(),

  salary: salaryDetailsSchema,
  workingHours: workingHoursSchema
});

export const employeeUpdateSchema = employeeSchema.partial().omit({ id: true });

export type CreateEmployeeInput = z.infer<typeof employeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof employeeUpdateSchema>;