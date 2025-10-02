import { Schema, model, Document } from 'mongoose';

export interface IEmployee extends Document {
  id: number;
  name: string;
  role: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: 'ذكر' | 'أنثى';
  maritalStatus?: string;
  mobilePhone: string;
  address?: string;
  joinDate: string;
  department?: string;
  branch: 'دبي' | 'الشارقة' | 'عجمان';
  contractType: 'كامل' | 'جزئي';
  contractEndDate?: string;
  contractEndReminderDays?: number;
  directManagerId?: number;
  residencyStatus?: string;
  proCardExpiry?: string;
  proCardReminderDays?: number;
  lawyerLicenses: {
    dubai?: { expiry: string; reminderDays: number; };
    sharjah?: { expiry: string; reminderDays: number; };
    ajman?: { expiry: string; reminderDays: number; };
    abuDhabi?: { expiry: string; reminderDays: number; };
  };
  healthInfo: {
    hasIssues: boolean;
    details?: string;
  };
  emergencyContacts: [{
    name: string;
    relationship: string;
    phone: string;
  }];
  documents: {
    passport?: { number: string; expiry: string; reminderDays: number; };
    emiratesId?: { number: string; expiry: string; reminderDays: number; };
    workPermit?: { number: string; expiry: string; reminderDays: number; };
    healthInsurance?: { expiry: string; reminderDays: number; };
  };
  bankInfo: {
    bankName?: string;
    iban?: string;
    accountNo?: string;
    salaryPaymentMethod?: 'wps' | 'bank transfer' | 'cash';
  };
  salary: {
    basic: number;
    housing: number;
    transport: number;
    other: number;
  };
  workingHours: {
    startTime: string;
    endTime: string;
  };

  // For login and permissions
  loginEnabled?: boolean;
}

const employeeSchema = new Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  nationality: String,
  dateOfBirth: String,
  gender: { type: String, enum: ['ذكر', 'أنثى'] },
  maritalStatus: String,
  mobilePhone: { type: String, required: true },
  address: String,
  joinDate: { type: String, required: true },
  department: String,
  branch: { 
    type: String, 
    required: true, 
    enum: ['دبي', 'الشارقة', 'عجمان']
  },
  contractType: { 
    type: String, 
    required: true, 
    enum: ['كامل', 'جزئي']
  },
  contractEndDate: String,
  contractEndReminderDays: Number,
  directManagerId: Number,
  residencyStatus: String,
  proCardExpiry: String,
  proCardReminderDays: Number,
  lawyerLicenses: {
    dubai: { expiry: String, reminderDays: Number },
    sharjah: { expiry: String, reminderDays: Number },
    ajman: { expiry: String, reminderDays: Number },
    abuDhabi: { expiry: String, reminderDays: Number }
  },
  healthInfo: {
    hasIssues: { type: Boolean, default: false },
    details: String
  },
  emergencyContacts: [{
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    phone: { type: String, required: true }
  }],
  documents: {
    passport: { 
      number: String,
      expiry: String,
      reminderDays: Number
    },
    emiratesId: {
      number: String,
      expiry: String,
      reminderDays: Number
    },
    workPermit: {
      number: String,
      expiry: String,
      reminderDays: Number
    },
    healthInsurance: {
      expiry: String,
      reminderDays: Number
    }
  },
  bankInfo: {
    bankName: String,
    iban: String,
    accountNo: String,
    salaryPaymentMethod: {
      type: String,
      enum: ['wps', 'bank transfer', 'cash']
    }
  },
  salary: {
    basic: { type: Number, required: true },
    housing: { type: Number, required: true },
    transport: { type: Number, required: true },
    other: { type: Number, default: 0 }
  },
  workingHours: {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },
  loginEnabled: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes for efficient queries
employeeSchema.index({ name: 1, role: 1, branch: 1 });
employeeSchema.index({ 'documents.passport.expiry': 1 });
employeeSchema.index({ 'documents.emiratesId.expiry': 1 });
employeeSchema.index({ contractEndDate: 1 });

export const Employee = model<IEmployee>('Employee', employeeSchema);