import { Schema, model, Document } from 'mongoose';

interface ITransactionItem {
  description: string;
  amount: number;
}

interface IBillItem {
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

interface IChequeDetails {
  no: string;
  date: string;
  bank: string;
}

export interface IInvoice extends Document {
  id: string;
  clientId: number;
  clientName?: string;
  caseId?: string;
  date: string;
  items: ITransactionItem[];
  totalAmount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  status: 'paid' | 'unpaid' | 'overdue';
}

export interface IPaymentReceipt extends Document {
  id: string;
  clientId: number;
  clientName?: string;
  date: string;
  amount: number;
  amountInWords: string;
  paymentMethod: 'Cash' | 'Cheque';
  chequeDetails?: IChequeDetails;
  description: string;
}

export interface IBill extends Document {
  id: string;
  clientId: number;
  clientName?: string;
  caseId?: string;
  date: string;
  items: IBillItem[];
  totalAmount: number;
}

export interface ICourtFee extends Document {
  id: string;
  clientId: number;
  clientName?: string;
  caseId?: string;
  court: string;
  date: string;
  items: ITransactionItem[];
  totalAmount: number;
}

const commonFields = {
  id: { type: String, required: true, unique: true },
  clientId: { type: Number, required: true },
  clientName: String,
  caseId: String,
  date: { type: String, required: true }
};

const invoiceSchema = new Schema({
  ...commonFields,
  items: [{
    description: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  vatRate: { type: Number, required: true },
  vatAmount: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  status: { 
    type: String, 
    required: true,
    enum: ['paid', 'unpaid', 'overdue'],
    default: 'unpaid'
  }
}, {
  timestamps: true
});

const paymentReceiptSchema = new Schema({
  ...commonFields,
  amount: { type: Number, required: true },
  amountInWords: { type: String, required: true },
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['Cash', 'Cheque']
  },
  chequeDetails: {
    no: String,
    date: String,
    bank: String
  },
  description: { type: String, required: true }
}, {
  timestamps: true
});

const billSchema = new Schema({
  ...commonFields,
  items: [{
    description: { type: String, required: true },
    qty: { type: Number, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true }
}, {
  timestamps: true
});

const courtFeeSchema = new Schema({
  ...commonFields,
  court: { type: String, required: true },
  items: [{
    description: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true }
}, {
  timestamps: true
});

// Indexes
invoiceSchema.index({ clientId: 1, status: 1 });
invoiceSchema.index({ caseId: 1 });
billSchema.index({ clientId: 1, caseId: 1 });
courtFeeSchema.index({ caseId: 1, court: 1 });

export const Invoice = model<IInvoice>('Invoice', invoiceSchema);
export const PaymentReceipt = model<IPaymentReceipt>('PaymentReceipt', paymentReceiptSchema);
export const Bill = model<IBill>('Bill', billSchema);
export const CourtFee = model<ICourtFee>('CourtFee', courtFeeSchema);