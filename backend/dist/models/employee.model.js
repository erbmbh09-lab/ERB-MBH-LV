"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Employee = void 0;
const mongoose_1 = require("mongoose");
const employeeSchema = new mongoose_1.Schema({
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
    }
}, {
    timestamps: true
});
// Indexes for efficient queries
employeeSchema.index({ name: 1, role: 1, branch: 1 });
employeeSchema.index({ 'documents.passport.expiry': 1 });
employeeSchema.index({ 'documents.emiratesId.expiry': 1 });
employeeSchema.index({ contractEndDate: 1 });
exports.Employee = (0, mongoose_1.model)('Employee', employeeSchema);
//# sourceMappingURL=employee.model.js.map