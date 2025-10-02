"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeUpdateSchema = exports.employeeSchema = void 0;
const zod_1 = require("zod");
const emergencyContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    relationship: zod_1.z.string(),
    phone: zod_1.z.string().min(9, 'Phone number must be at least 9 digits')
});
const salaryDetailsSchema = zod_1.z.object({
    basic: zod_1.z.number(),
    housing: zod_1.z.number(),
    transport: zod_1.z.number(),
    other: zod_1.z.number()
});
const workingHoursSchema = zod_1.z.object({
    startTime: zod_1.z.string(),
    endTime: zod_1.z.string()
});
const lawyerLicenseSchema = zod_1.z.object({
    expiry: zod_1.z.string().optional(),
    reminderDays: zod_1.z.number().optional()
});
exports.employeeSchema = zod_1.z.object({
    id: zod_1.z.number(),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    role: zod_1.z.string(),
    nationality: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string().optional(),
    gender: zod_1.z.enum(['ذكر', 'أنثى']).optional(),
    maritalStatus: zod_1.z.string().optional(),
    mobilePhone: zod_1.z.string().min(9, 'Mobile number must be at least 9 digits'),
    address: zod_1.z.string().optional(),
    joinDate: zod_1.z.string(),
    department: zod_1.z.string().optional(),
    branch: zod_1.z.enum(['دبي', 'الشارقة', 'عجمان']),
    contractType: zod_1.z.enum(['كامل', 'جزئي']),
    contractEndDate: zod_1.z.string().optional(),
    contractEndReminderDays: zod_1.z.number().optional(),
    directManagerId: zod_1.z.number().optional(),
    residencyStatus: zod_1.z.string().optional(),
    proCardExpiry: zod_1.z.string().optional(),
    proCardReminderDays: zod_1.z.number().optional(),
    lawyerLicenses: zod_1.z.object({
        dubai: lawyerLicenseSchema.optional(),
        sharjah: lawyerLicenseSchema.optional(),
        ajman: lawyerLicenseSchema.optional(),
        abuDhabi: lawyerLicenseSchema.optional()
    }).optional(),
    healthInfo: zod_1.z.object({
        hasIssues: zod_1.z.boolean().default(false),
        details: zod_1.z.string().optional()
    }).optional(),
    emergencyContacts: zod_1.z.array(emergencyContactSchema).optional(),
    documents: zod_1.z.object({
        passport: zod_1.z.object({
            number: zod_1.z.string().optional(),
            expiry: zod_1.z.string().optional(),
            reminderDays: zod_1.z.number().optional()
        }).optional(),
        emiratesId: zod_1.z.object({
            number: zod_1.z.string().optional(),
            expiry: zod_1.z.string().optional(),
            reminderDays: zod_1.z.number().optional()
        }).optional(),
        workPermit: zod_1.z.object({
            number: zod_1.z.string().optional(),
            expiry: zod_1.z.string().optional(),
            reminderDays: zod_1.z.number().optional()
        }).optional(),
        healthInsurance: zod_1.z.object({
            expiry: zod_1.z.string().optional(),
            reminderDays: zod_1.z.number().optional()
        }).optional()
    }).optional(),
    bankInfo: zod_1.z.object({
        bankName: zod_1.z.string().optional(),
        iban: zod_1.z.string().optional(),
        accountNo: zod_1.z.string().optional(),
        salaryPaymentMethod: zod_1.z.enum(['wps', 'bank transfer', 'cash']).optional()
    }).optional(),
    salary: salaryDetailsSchema,
    workingHours: workingHoursSchema
});
exports.employeeUpdateSchema = exports.employeeSchema.partial().omit({ id: true });
//# sourceMappingURL=employee.schema.js.map