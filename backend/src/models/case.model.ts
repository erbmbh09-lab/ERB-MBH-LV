import { Schema, model, Document } from 'mongoose';

interface IParty {
  clientId: number;
  capacity: 'client' | 'opponent';
}

interface ISession {
  date: string;
  time: string;
  notes?: string;
  reservedForJudgment?: boolean;
  judgmentPostponed?: boolean;
}

interface ILitigationStage {
  degree: string;
  caseNumber: string;
  year: string;
  clientCapacity: string;
  opponentCapacity: string;
  referralDate: string;
  sessions: ISession[];
}

interface IJudicialAnnouncement {
  title: string;
  issueDate: string;
  legalPeriod: string;
}

interface IPetitionOrder {
  submissionDate: string;
  orderType: string;
  judgeDecision: 'accepted' | 'rejected' | 'pending';
  legalPeriod: string;
}

interface IExecution {
  date: string;
  type: string;
  status: 'قيد التنفيذ' | 'منفذ' | 'متوقف';
  amount: string;
}

interface IMemo {
  title: string;
  content: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'submitted';
  deadline: string;
  managerNotes?: string;
}

interface IDocument {
  title: string;
  type: string;
  uploadDate: string;
  uploadedBy: number;
  fileUrl: string;
  notes?: string;
}

export interface ICase extends Document {
  caseNumber: string;
  court: string;
  type: string;
  subject: string;
  value: number;
  assignedLawyerId: number;
  assistantLawyerId?: number;
  parties: IParty[];
  status: 'active' | 'closed' | 'suspended';
  priority: 'normal' | 'high' | 'urgent';
  openDate: string;
  closeDate?: string;
  litigationStages: ILitigationStage[];
  judicialAnnouncements: IJudicialAnnouncement[];
  petitionOrders: IPetitionOrder[];
  executions: IExecution[];
  memos: IMemo[];
  documents: IDocument[];
  linkedCases?: string[];
  notes?: string;
}

const caseSchema = new Schema({
  caseNumber: { type: String, required: true, unique: true },
  court: { type: String, required: true },
  type: { type: String, required: true },
  subject: { type: String, required: true },
  value: { type: Number, required: true },
  assignedLawyerId: { type: Number, required: true },
  assistantLawyerId: Number,
  parties: [{
    clientId: { type: Number, required: true },
    capacity: { 
      type: String, 
      required: true,
      enum: ['client', 'opponent']
    }
  }],
  status: { 
    type: String, 
    required: true,
    enum: ['active', 'closed', 'suspended'],
    default: 'active'
  },
  priority: {
    type: String,
    required: true,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  openDate: { type: String, required: true },
  closeDate: String,
  litigationStages: [{
    degree: { type: String, required: true },
    caseNumber: { type: String, required: true },
    year: { type: String, required: true },
    clientCapacity: { type: String, required: true },
    opponentCapacity: { type: String, required: true },
    referralDate: { type: String, required: true }
  }],
  judicialAnnouncements: [{
    title: { type: String, required: true },
    issueDate: { type: String, required: true },
    legalPeriod: { type: String, required: true }
  }],
  petitionOrders: [{
    submissionDate: { type: String, required: true },
    orderType: { type: String, required: true },
    judgeDecision: { 
      type: String, 
      required: true,
      enum: ['accepted', 'rejected', 'pending']
    },
    legalPeriod: { type: String, required: true }
  }],
  executions: [{
    date: { type: String, required: true },
    type: { type: String, required: true },
    status: { 
      type: String, 
      required: true,
      enum: ['قيد التنفيذ', 'منفذ', 'متوقف']
    },
    amount: { type: String, required: true }
  }],
  memos: [{
    title: { type: String, required: true },
    content: { type: String, required: true },
    status: { 
      type: String, 
      required: true,
      enum: ['draft', 'pending_approval', 'approved', 'rejected', 'submitted']
    },
    deadline: { type: String, required: true },
    managerNotes: String
  }],
  documents: [{
    title: { type: String, required: true },
    type: { type: String, required: true },
    uploadDate: { type: String, required: true },
    uploadedBy: { type: Number, required: true },
    fileUrl: { type: String, required: true },
    notes: String
  }],
  linkedCases: [String],
  notes: String
}, {
  timestamps: true
});

// Indexes for efficient queries
caseSchema.index({ caseNumber: 1 });
caseSchema.index({ assignedLawyerId: 1 });
caseSchema.index({ status: 1 });
caseSchema.index({ 'parties.clientId': 1 });
caseSchema.index({ openDate: 1, closeDate: 1 });

export const Case = model<ICase>('Case', caseSchema);