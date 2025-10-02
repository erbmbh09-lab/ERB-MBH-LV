import { Schema, model, Document } from 'mongoose';

interface IComment {
  authorId: number;
  content: string;
  timestamp: string;
  attachments?: {
    fileUrl: string;
    fileName: string;
    uploadedAt: string;
  }[];
}

interface IApprovalStep {
  approverId: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  notes?: string;
}

export interface ITask extends Document {
  title: string;
  description: string;
  type: 'personal' | 'assigned';
  status: 'new' | 'in-progress' | 'pending-approval' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  assignerId: number;
  assigneeId: number;
  createdAt: string;
  dueDate: string;
  completedAt?: string;
  relatedCaseId?: string;
  comments?: IComment[];
  approvalWorkflow?: IApprovalStep[];
  courtInfo?: {
    caseNumber?: string;
    hearingDate?: string;
    requiredDocuments?: string[];
    [key: string]: any;
  };
}

const taskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['personal', 'assigned']
  },
  status: { 
    type: String, 
    required: true,
    enum: ['new', 'in-progress', 'pending-approval', 'completed', 'rejected'],
    default: 'new'
  },
  priority: { 
    type: String, 
    required: true,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignerId: { type: Number, required: true },
  assigneeId: { type: Number, required: true },
  createdAt: { type: String, required: true },
  dueDate: { type: String, required: true },
  completedAt: String,
  relatedCaseId: String,
  comments: [{
    authorId: { type: Number, required: true },
    content: { type: String, required: true },
    timestamp: { type: String, required: true },
    attachments: [{
      fileUrl: { type: String },
      fileName: { type: String },
      uploadedAt: { type: String }
    }]
  }],
  approvalWorkflow: [{
    approverId: { type: Number, required: true },
    status: { 
      type: String, 
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedAt: String,
    notes: String
  }],
  courtInfo: {
    caseNumber: String,
    hearingDate: String,
    requiredDocuments: [String]
    // Add more fields as needed
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
taskSchema.index({ assigneeId: 1, status: 1 });
taskSchema.index({ assignerId: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ relatedCaseId: 1 });

export const Task = model<ITask>('Task', taskSchema);