import { Schema, model, Document } from 'mongoose';

export interface IClient extends Document {
  id: number;
  classification: 'موكل' | 'خصم';
  nameAr: string;
  nameEn: string;
  nationality?: string;
  emiratesId?: string;
  passportNo?: string;
  phone1: string;
  phone2?: string;
  email?: string;
  address?: string;
  username: string;
  loginEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema({
  id: { type: Number, required: true, unique: true },
  classification: { 
    type: String, 
    required: true, 
    enum: ['موكل', 'خصم']
  },
  nameAr: { type: String, required: true },
  nameEn: { type: String, required: true },
  nationality: String,
  emiratesId: String,
  passportNo: String,
  phone1: { type: String, required: true },
  phone2: String,
  email: String,
  address: String,
  username: { type: String, required: true, unique: true },
  loginEnabled: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Index for efficient queries
clientSchema.index({ nameAr: 1, nameEn: 1, phone1: 1 });

export const Client = model<IClient>('Client', clientSchema);