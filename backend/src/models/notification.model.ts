import { Schema, model, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  employeeId?: number;
  clientId?: number;
  title: string;
  content: string;
  type: 'CASE' | 'TASK' | 'DOCUMENT' | 'DEADLINE' | 'HR' | 'SYSTEM';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  relatedTo?: {
    type: 'case' | 'task' | 'document' | 'employee' | 'client';
    id: string;
  };
  actionRequired?: string;
  expiresAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema({
  userId: { type: String, required: true },
  employeeId: { type: Number },
  clientId: { type: Number },
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['CASE', 'TASK', 'DOCUMENT', 'DEADLINE', 'HR', 'SYSTEM']
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    required: true,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  relatedTo: {
    type: {
      type: String,
      enum: ['case', 'task', 'document', 'employee', 'client']
    },
    id: String
  },
  actionRequired: String,
  expiresAt: Date,
  readAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ employeeId: 1 });
notificationSchema.index({ clientId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: 1 });
notificationSchema.index({ expiresAt: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);