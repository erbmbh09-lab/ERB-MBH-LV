import { z } from 'zod';

const partySchema = z.object({
  clientId: z.number(),
  capacity: z.enum(['client', 'opponent'])
});

const litigationStageSchema = z.object({
  degree: z.string(),
  caseNumber: z.string(),
  year: z.string(),
  clientCapacity: z.string(),
  opponentCapacity: z.string(),
  referralDate: z.string()
});

const judicialAnnouncementSchema = z.object({
  title: z.string(),
  issueDate: z.string(),
  legalPeriod: z.string()
});

const petitionOrderSchema = z.object({
  submissionDate: z.string(),
  orderType: z.string(),
  judgeDecision: z.enum(['accepted', 'rejected', 'pending']),
  legalPeriod: z.string()
});

const executionSchema = z.object({
  date: z.string(),
  type: z.string(),
  status: z.enum(['قيد التنفيذ', 'منفذ', 'متوقف']),
  amount: z.string()
});

const memoSchema = z.object({
  title: z.string(),
  content: z.string(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'submitted']),
  deadline: z.string(),
  managerNotes: z.string().optional()
});

const documentSchema = z.object({
  title: z.string(),
  type: z.string(),
  uploadDate: z.string(),
  uploadedBy: z.number(),
  fileUrl: z.string(),
  notes: z.string().optional()
});

export const caseSchema = z.object({
  caseNumber: z.string(),
  court: z.string(),
  type: z.string(),
  subject: z.string(),
  value: z.number(),
  assignedLawyerId: z.number(),
  assistantLawyerId: z.number().optional(),
  parties: z.array(partySchema),
  status: z.enum(['active', 'closed', 'suspended']),
  priority: z.enum(['normal', 'high', 'urgent']),
  openDate: z.string(),
  closeDate: z.string().optional(),
  litigationStages: z.array(litigationStageSchema),
  judicialAnnouncements: z.array(judicialAnnouncementSchema),
  petitionOrders: z.array(petitionOrderSchema),
  executions: z.array(executionSchema),
  memos: z.array(memoSchema),
  documents: z.array(documentSchema),
  linkedCases: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export const caseUpdateSchema = caseSchema.partial().omit({ caseNumber: true });

export type CreateCaseInput = z.infer<typeof caseSchema>;
export type UpdateCaseInput = z.infer<typeof caseUpdateSchema>;