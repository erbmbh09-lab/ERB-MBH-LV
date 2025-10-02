import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';

// --- INTERFACES ---
export interface TransactionItem { description: string; amount: number; }
export interface Invoice { id: string; clientId: number; clientName?: string; caseId?: string; date: string; items: TransactionItem[]; totalAmount: number; vatRate: number; vatAmount: number; grandTotal: number; status: 'paid' | 'unpaid' | 'overdue'; }
export interface PaymentReceipt { id: string; clientId: number; clientName?: string; date: string; amount: number; amountInWords: string; paymentMethod: 'Cash' | 'Cheque'; chequeDetails?: { no: string; date: string; bank: string; }; description: string; }
export interface BillItem { description: string; qty: number; rate: number; amount: number; }
export interface Bill { id: string; clientId: number; clientName?: string; caseId?: string; date: string; items: BillItem[]; totalAmount: number; }
export interface BillPayment { id: string; paidTo: string; date: string; amount: number; amountInWords: string; paymentMethod: 'Cash' | 'Cheque'; chequeDetails?: { no: string; date: string; bank: string; }; description: string; }
export interface CourtFee { id: string; clientId: number; clientName?: string; caseId?: string; court: string; date: string; items: TransactionItem[]; totalAmount: number; }
export interface DepositItem { type: 'Cash' | 'Cheque'; from: string; amount: number; chequeNo?: string; }
export interface DepositRecord { id: string; date: string; bankAccountName: string; items: DepositItem[]; totalAmount: number; }
export interface BankAccount { name: string; accountNumber: string; balance: number; currency: 'AED'; }
export interface PettyCashHolder { name: string; branch: 'دبي' | 'الشارقة' | 'عجمان'; balance: number; currency: 'AED'; }

const MOCK_INVOICES: Invoice[] = [
    { id: 'INV-2024-001', clientId: 7607, caseId: 'DXB-C-2024-112', date: '2024-02-01', items: [{ description: 'دفعة أولى أتعاب محاماة', amount: 15000 }], totalAmount: 15000, vatRate: 0.05, vatAmount: 750, grandTotal: 15750, status: 'paid' },
    { id: 'INV-2024-002', clientId: 7606, caseId: 'SHJ-L-2023-056', date: '2024-04-10', items: [{ description: 'أتعاب مرحلة الاستئناف', amount: 10000 }], totalAmount: 10000, vatRate: 0.05, vatAmount: 500, grandTotal: 10500, status: 'unpaid' },
];
const MOCK_RECEIPTS: PaymentReceipt[] = [
    { id: 'PR-2024-001', clientId: 7607, date: '2024-02-05', amount: 15750, amountInWords: 'خمسة عشر ألف وسبعمئة وخمسون درهماً', paymentMethod: 'Cheque', chequeDetails: { no: '12345', date: '2024-02-05', bank: 'بنك دبي الوطني' }, description: 'سداد فاتورة INV-2024-001' }
];
const MOCK_BILLS: Bill[] = [
    { id: 'BILL-2024-001', clientId: 7607, caseId: 'DXB-C-2024-112', date: '2024-03-01', items: [{ description: 'رسوم خبير', qty: 1, rate: 5000, amount: 5000 }], totalAmount: 5000 }
];
const MOCK_COURT_FEES: CourtFee[] = [
    { id: 'FEE-2024-001', clientId: 7607, caseId: 'DXB-C-2024-112', court: 'محكمة دبي الابتدائية', date: '2024-01-15', items: [{ description: 'رسوم قيد دعوى تجارية', amount: 2000 }], totalAmount: 2000 }
];
const MOCK_BANK_ACCOUNTS: BankAccount[] = [
    { name: 'بنك دبي الوطني', accountNumber: 'AE12345678901234567890', balance: 250000, currency: 'AED' },
    { name: 'بنك أبوظبي التجاري', accountNumber: 'AE09876543210987654321', balance: 175000, currency: 'AED' }
];
const MOCK_PETTY_CASH: PettyCashHolder[] = [
    { name: 'خزينة مكتب دبي', branch: 'دبي', balance: 5000, currency: 'AED' },
    { name: 'عهدة السكرتارية', branch: 'دبي', balance: 1500, currency: 'AED' }
];

@Injectable({ providedIn: 'root' })
export class FinancialService {
  private http = inject(HttpClient);

  invoices = signal<Invoice[]>([]);
  paymentReceipts = signal<PaymentReceipt[]>([]);
  bills = signal<Bill[]>([]);
  courtFees = signal<CourtFee[]>([]);
  billPayments = signal<BillPayment[]>([]);
  depositRecords = signal<DepositRecord[]>([]);
  bankAccounts = signal<BankAccount[]>([]);
  pettyCashHolders = signal<PettyCashHolder[]>([]);

  constructor() {
    this.invoices.set(MOCK_INVOICES);
    this.paymentReceipts.set(MOCK_RECEIPTS);
    this.bills.set(MOCK_BILLS);
    this.courtFees.set(MOCK_COURT_FEES);
    this.bankAccounts.set(MOCK_BANK_ACCOUNTS);
    this.pettyCashHolders.set(MOCK_PETTY_CASH);
  }

  addInvoice = (data: Omit<Invoice, 'id'>) => firstValueFrom(this.http.post<Invoice>('/api/invoices', data).pipe(tap(res => this.invoices.update(v => [...v, res]))));
  addPaymentReceipt = (data: Omit<PaymentReceipt, 'id'>) => firstValueFrom(this.http.post<PaymentReceipt>('/api/payment-receipts', data).pipe(tap(res => this.paymentReceipts.update(v => [...v, res]))));
  addBill = (data: Omit<Bill, 'id'>) => firstValueFrom(this.http.post<Bill>('/api/bills', data).pipe(tap(res => this.bills.update(v => [...v, res]))));
  addBillPayment = (data: Omit<BillPayment, 'id'>) => firstValueFrom(this.http.post<BillPayment>('/api/bill-payments', data).pipe(tap(res => this.billPayments.update(v => [...v, res]))));
  addCourtFee = (data: Omit<CourtFee, 'id'>) => firstValueFrom(this.http.post<CourtFee>('/api/court-fees', data).pipe(tap(res => this.courtFees.update(v => [...v, res]))));
  addDepositRecord = (data: Omit<DepositRecord, 'id'>) => firstValueFrom(this.http.post<DepositRecord>('/api/deposit-records', data).pipe(tap(res => this.depositRecords.update(v => [...v, res]))));
  addBankAccount = (data: BankAccount) => firstValueFrom(this.http.post<BankAccount>('/api/bank-accounts', data).pipe(tap(res => this.bankAccounts.update(v => [...v, res]))));
  updateBankAccount = (data: BankAccount) => firstValueFrom(this.http.put<BankAccount>(`/api/bank-accounts/${data.accountNumber}`, data).pipe(tap(res => this.bankAccounts.update(v => v.map(a => a.accountNumber === res.accountNumber ? res : a)))));
  deleteBankAccount = (accountNumber: string) => firstValueFrom(this.http.delete<void>(`/api/bank-accounts/${accountNumber}`).pipe(tap(() => this.bankAccounts.update(v => v.filter(a => a.accountNumber !== accountNumber)))));
  addPettyCashHolder = (data: PettyCashHolder) => firstValueFrom(this.http.post<PettyCashHolder>('/api/petty-cash-holders', data).pipe(tap(res => this.pettyCashHolders.update(v => [...v, res]))));
  updatePettyCashHolder = (data: PettyCashHolder) => firstValueFrom(this.http.put<PettyCashHolder>(`/api/petty-cash-holders/${data.name}`, data).pipe(tap(res => this.pettyCashHolders.update(v => v.map(h => h.name === res.name ? res : h)))));
  deletePettyCashHolder = (name: string) => firstValueFrom(this.http.delete<void>(`/api/petty-cash-holders/${name}`).pipe(tap(() => this.pettyCashHolders.update(v => v.filter(h => h.name !== name)))));
}
