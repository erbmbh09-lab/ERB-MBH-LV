import { Schema, model, Document } from 'mongoose';

export interface ILegalDeadline extends Document {
  caseId: string;
  caseNumber: string;
  client: string;
  judgmentDate: string;
  deadlineInDays: number;
  actionRequired: 'تسجيل الدعوى رسمياً' | 'تقديم تظلم' | 'تقديم استئناف' | 'تقديم طعن';
  stage: 'عريضة مقبولة' | 'عريضة مرفوضة' | 'حكم ابتدائي' | 'حكم استئناف';
  createdAt: Date;
  updatedAt: Date;
}

const legalDeadlineSchema = new Schema({
  caseId: { type: String, required: true },
  caseNumber: { type: String, required: true },
  client: { type: String, required: true },
  judgmentDate: { type: String, required: true },
  deadlineInDays: { type: Number, required: true },
  actionRequired: { 
    type: String, 
    required: true,
    enum: ['تسجيل الدعوى رسمياً', 'تقديم تظلم', 'تقديم استئناف', 'تقديم طعن']
  },
  stage: {
    type: String,
    required: true,
    enum: ['عريضة مقبولة', 'عريضة مرفوضة', 'حكم ابتدائي', 'حكم استئناف']
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
legalDeadlineSchema.index({ caseNumber: 1 });
legalDeadlineSchema.index({ judgmentDate: 1 });
legalDeadlineSchema.index({ stage: 1 });

export const LegalDeadline = model<ILegalDeadline>('LegalDeadline', legalDeadlineSchema);