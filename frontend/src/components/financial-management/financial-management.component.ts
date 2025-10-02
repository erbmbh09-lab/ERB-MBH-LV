// FIX: Moved FormGroup from @angular/core to @angular/forms
import { Component, ChangeDetectionStrategy, signal, inject, computed, Renderer2, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { DataHubService } from '../../services/data-hub.service';
import { Client } from '../../services/client.service';
import { Case } from '../../services/case.service';
import { Invoice, PaymentReceipt, Bill, TransactionItem, BillPayment, CourtFee, BillItem, DepositRecord, BankAccount, PettyCashHolder } from '../../services/financial.service';


type ActiveTab = 'customers' | 'balances' | 'banks' | 'pettyCash';
type ActiveModal = 'none' | 'invoice' | 'paymentReceipt' | 'depositRecord' | 'bill' | 'billPayment' | 'courtFee' | 'statement' | 'outstanding' | 'bankAccount' | 'pettyCashHolder';

export interface StatementTransaction {
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
}

export interface OutstandingBalance {
  clientId: number;
  clientName: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

@Component({
  selector: 'app-financial-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './financial-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class FinancialManagementComponent {
  // FIX: Explicitly type `fb` as `FormBuilder` to resolve type inference errors on `.group()` and `.array()`.
  private fb: FormBuilder = inject(FormBuilder);
  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);
  private datePipe = inject(DatePipe);
  dataHubService = inject(DataHubService);
  notificationService = inject(NotificationService);

  activeTab = signal<ActiveTab>('customers');
  activeModal = signal<ActiveModal>('none');
  modalData = signal<{ client?: Client, case?: Case, account?: BankAccount, holder?: PettyCashHolder } | null>(null);
  editingBankAccount = signal<BankAccount | null>(null);
  editingPettyCashHolder = signal<PettyCashHolder | null>(null);

  // Forms
  invoiceForm = this.fb.group({
    clientId: [null as number | null, Validators.required],
    caseId: [''],
    date: [this.datePipe.transform(new Date(), 'yyyy-MM-dd'), Validators.required],
    items: this.fb.array([this.createTransactionItem()]),
  });
  
  paymentReceiptForm = this.fb.group({
    clientId: [null as number | null, Validators.required],
    date: [this.datePipe.transform(new Date(), 'yyyy-MM-dd'), Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    paymentMethod: ['Cash' as 'Cash' | 'Cheque', Validators.required],
    chequeNo: [''],
    chequeDate: [''],
    chequeBank: [''],
    description: ['', Validators.required]
  });

  billForm = this.fb.group({
    clientId: [null as number | null, Validators.required],
    caseId: [''],
    date: [this.datePipe.transform(new Date(), 'yyyy-MM-dd'), Validators.required],
    items: this.fb.array([this.createBillItem()]),
  });

  billPaymentForm = this.fb.group({
    paidTo: ['', Validators.required],
    date: [this.datePipe.transform(new Date(), 'yyyy-MM-dd'), Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    paymentMethod: ['Cash' as 'Cash' | 'Cheque', Validators.required],
    chequeNo: [''],
    chequeDate: [''],
    chequeBank: [''],
    description: ['', Validators.required]
  });

  courtFeeForm = this.fb.group({
    clientId: [null as number | null, Validators.required],
    caseId: [''],
    court: ['', Validators.required],
    date: [this.datePipe.transform(new Date(), 'yyyy-MM-dd'), Validators.required],
    items: this.fb.array([this.createTransactionItem()])
  });

  depositRecordForm = this.fb.group({
    date: [this.datePipe.transform(new Date(), 'yyyy-MM-dd'), Validators.required],
    bankAccountName: ['', Validators.required],
    items: this.fb.array([this.createDepositItem()]),
  });

  bankAccountForm = this.fb.group({
    name: ['', Validators.required],
    accountNumber: ['', Validators.required],
    balance: [0, [Validators.required, Validators.min(0)]],
    currency: ['AED' as const, Validators.required]
  });

  pettyCashHolderForm = this.fb.group({
    name: ['', Validators.required],
    branch: ['دبي' as 'دبي' | 'الشارقة' | 'عجمان', Validators.required],
    balance: [0, [Validators.required, Validators.min(0)]],
    currency: ['AED' as const, Validators.required]
  });

  statementSelectionForm = this.fb.group({
    clientId: [null as number | null, Validators.required],
    fromDate: [''],
    toDate: [''],
  });

  statementData = signal<{
    client: Client;
    transactions: (StatementTransaction & { balance: number })[];
    openingBalance: number;
    closingBalance: number;
    totalDebit: number;
    totalCredit: number;
  } | null>(null);

  // Data Signals
  clients = this.dataHubService.clients.clients;
  cases = this.dataHubService.cases.cases;
  bankAccounts = this.dataHubService.financial.bankAccounts;
  pettyCashHolders = this.dataHubService.financial.pettyCashHolders;
  bills = this.dataHubService.financial.bills;
  courtFees = this.dataHubService.financial.courtFees;
  billPayments = this.dataHubService.financial.billPayments;

  // Computed values for modals
  invoiceTotals = computed(() => {
    // FIX: Use getRawValue() to get the full form value and allow for correct type inference on items.
    const items = this.invoiceForm.getRawValue().items || [];
    const totalAmount = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const vatAmount = totalAmount * 0.05;
    const grandTotal = totalAmount + vatAmount;
    return { totalAmount, vatAmount, grandTotal };
  });
  
  billTotals = computed(() => {
    const items = this.billForm.getRawValue().items || [];
    const totalAmount = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    return { totalAmount };
  });

  depositTotals = computed(() => {
    // FIX: Use getRawValue() to get the full form value and allow for correct type inference on items. This resolves the error where `{ [key: string]: any; }[]` from `get(...).value` was not assignable to a typed array.
    const items = this.depositRecordForm.getRawValue().items || [];
    const totalAmount = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    return { totalAmount };
  });

  courtFeeTotals = computed(() => {
    // FIX: Use getRawValue() to get the full form value and allow for correct type inference on items.
    const items = this.courtFeeForm.getRawValue().items || [];
    const totalAmount = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    return { totalAmount };
  });

  outstandingBalances = computed<OutstandingBalance[]>(() => {
    const clients = this.clients();
    const balances: OutstandingBalance[] = [];

    for (const client of clients) {
        const clientInvoices = this.dataHubService.financial.invoices().filter(i => i.clientId === client.id);
        const clientBills = this.dataHubService.financial.bills().filter(b => b.clientId === client.id);
        const clientCourtFees = this.dataHubService.financial.courtFees().filter(cf => cf.clientId === client.id);
        const clientPayments = this.dataHubService.financial.paymentReceipts().filter(pr => pr.clientId === client.id);

        const totalDebit = 
            clientInvoices.reduce((sum, i) => sum + i.grandTotal, 0) +
            clientBills.reduce((sum, b) => sum + b.totalAmount, 0) +
            clientCourtFees.reduce((sum, cf) => sum + cf.totalAmount, 0);

        const totalCredit = clientPayments.reduce((sum, p) => sum + p.amount, 0);

        const balance = totalDebit - totalCredit;

        if (balance > 0) {
            balances.push({
                clientId: client.id,
                clientName: client.nameAr,
                totalDebit,
                totalCredit,
                balance
            });
        }
    }
    return balances.sort((a, b) => b.balance - a.balance);
  });

  totalOutstanding = computed(() => {
    return this.outstandingBalances().reduce((sum, b) => sum + b.balance, 0);
  });

  totalBankBalance = computed(() => {
    return this.bankAccounts().reduce((sum, acc) => sum + acc.balance, 0);
  });

  totalPettyCashBalance = computed(() => {
    return this.pettyCashHolders().reduce((sum, holder) => sum + holder.balance, 0);
  });

  selectedClient = computed(() => {
      let clientId: number | null | undefined;
      switch(this.activeModal()) {
        case 'invoice': clientId = this.invoiceForm.get('clientId')?.value; break;
        case 'paymentReceipt': clientId = this.paymentReceiptForm.get('clientId')?.value; break;
        case 'bill': clientId = this.billForm.get('clientId')?.value; break;
        case 'courtFee': clientId = this.courtFeeForm.get('clientId')?.value; break;
        case 'statement': clientId = this.statementSelectionForm.get('clientId')?.value; break;
      }
      return this.clients().find(c => c.id === Number(clientId));
  });

  selectedCase = computed(() => {
    let caseId: string | null | undefined;
    switch(this.activeModal()){
       case 'bill': caseId = this.billForm.get('caseId')?.value; break;
       case 'courtFee': caseId = this.courtFeeForm.get('caseId')?.value; break;
    }
    return this.cases().find(c => c.id === caseId);
  });

  constructor() {
    const setupChequeValidation = (form: FormGroup) => {
      form.get('paymentMethod')?.valueChanges.subscribe(method => {
          const chequeControls = ['chequeNo', 'chequeDate', 'chequeBank'];
          if (method === 'Cheque') {
              chequeControls.forEach(ctrl => form.get(ctrl)?.setValidators([Validators.required]));
          } else {
              chequeControls.forEach(ctrl => form.get(ctrl)?.clearValidators());
          }
          chequeControls.forEach(ctrl => form.get(ctrl)?.updateValueAndValidity());
      });
    };
    setupChequeValidation(this.paymentReceiptForm);
    setupChequeValidation(this.billPaymentForm);
  }
  
  get invoiceItems() { return this.invoiceForm.get('items') as FormArray; }
  createTransactionItem() { return this.fb.group({ description: ['', Validators.required], amount: [0, [Validators.required, Validators.min(0.01)]] }); }
  addInvoiceItem() { this.invoiceItems.push(this.createTransactionItem()); }
  removeInvoiceItem(index: number) { this.invoiceItems.removeAt(index); }
  
  get billItems() { return this.billForm.get('items') as FormArray; }
  createBillItem(): FormGroup { 
    const group = this.fb.group({ 
        description: ['', Validators.required], 
        qty: [1, [Validators.required, Validators.min(1)]],
        rate: [0, [Validators.required, Validators.min(0.01)]],
        amount: [{value: 0, disabled: true}]
    });
    const updateAmount = () => {
        const qty = group.get('qty')?.value || 0;
        const rate = group.get('rate')?.value || 0;
        group.get('amount')?.setValue(qty * rate, { emitEvent: false });
    };
    group.get('qty')?.valueChanges.subscribe(updateAmount);
    group.get('rate')?.valueChanges.subscribe(updateAmount);
    return group;
  }
  addBillItem() { this.billItems.push(this.createBillItem()); }
  removeBillItem(index: number) { this.billItems.removeAt(index); }
  
  get courtFeeItems() { return this.courtFeeForm.get('items') as FormArray; }
  addCourtFeeItem() { this.courtFeeItems.push(this.createTransactionItem()); }
  removeCourtFeeItem(index: number) { this.courtFeeItems.removeAt(index); }

  get depositItems() { return this.depositRecordForm.get('items') as FormArray; }
  createDepositItem(): FormGroup {
    return this.fb.group({
      type: ['Cash' as 'Cash' | 'Cheque', Validators.required],
      from: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      chequeNo: [''],
    });
  }
  addDepositItem() { this.depositItems.push(this.createDepositItem()); }
  removeDepositItem(index: number) { this.depositItems.removeAt(index); }


  openModal(modalType: ActiveModal, data: { client?: Client, case?: Case, account?: BankAccount, holder?: PettyCashHolder } | null = null) {
    this.modalData.set(data);
    this.activeModal.set(modalType);
    this.renderer.addClass(document.body, 'print-modal-active');
    
    const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd');

    switch (modalType) {
      case 'invoice':
        this.invoiceForm.reset({ date: today });
        this.invoiceItems.clear(); this.addInvoiceItem();
        if(data?.client) this.invoiceForm.get('clientId')?.setValue(data.client.id);
        if(data?.case) this.invoiceForm.get('caseId')?.setValue(data.case.id);
        break;
      case 'paymentReceipt':
        this.paymentReceiptForm.reset({ date: today, paymentMethod: 'Cash' });
        if(data?.client) this.paymentReceiptForm.get('clientId')?.setValue(data.client.id);
        break;
      case 'bill':
        this.billForm.reset({ date: today });
        this.billItems.clear(); this.addBillItem();
        break;
      case 'billPayment':
        this.billPaymentForm.reset({ date: today, paymentMethod: 'Cash' });
        break;
      case 'courtFee':
        this.courtFeeForm.reset({ date: today });
        this.courtFeeItems.clear(); this.addCourtFeeItem();
        break;
      case 'depositRecord':
        this.depositRecordForm.reset({ date: today, bankAccountName: this.bankAccounts()[0]?.name });
        this.depositItems.clear();
        this.addDepositItem();
        break;
      case 'statement':
        this.clearStatement();
        break;
      case 'bankAccount':
        this.editingBankAccount.set(data?.account || null);
        this.bankAccountForm.reset({ currency: 'AED' });
        if (data?.account) {
          this.bankAccountForm.patchValue(data.account);
          this.bankAccountForm.get('accountNumber')?.disable();
        } else {
          this.bankAccountForm.get('accountNumber')?.enable();
        }
        break;
      case 'pettyCashHolder':
        this.editingPettyCashHolder.set(data?.holder || null);
        this.pettyCashHolderForm.reset({ branch: 'دبي', currency: 'AED' });
        if (data?.holder) {
          this.pettyCashHolderForm.patchValue(data.holder);
          this.pettyCashHolderForm.get('name')?.disable();
        } else {
          this.pettyCashHolderForm.get('name')?.enable();
        }
        break;
      case 'outstanding':
        // No special setup needed, the computed signal handles the data.
        break;
    }
  }

  closeModal() {
    this.activeModal.set('none');
    this.modalData.set(null);
    this.editingBankAccount.set(null);
    this.editingPettyCashHolder.set(null);
    this.renderer.removeClass(document.body, 'print-modal-active');
  }
  
  saveInvoice() {
      if (this.invoiceForm.invalid) {
          this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء جميع الحقول المطلوبة في الفاتورة.' });
          return;
      }
      const formValue = this.invoiceForm.getRawValue();
      const totals = this.invoiceTotals();
      const newInvoiceData: Omit<Invoice, 'id'> = {
          clientId: formValue.clientId!,
          clientName: this.clients().find(c => c.id === formValue.clientId)?.nameAr,
          caseId: formValue.caseId || undefined,
          date: formValue.date!,
          items: formValue.items as TransactionItem[],
          vatRate: 0.05,
          status: 'unpaid',
          ...totals
      };
      this.dataHubService.financial.addInvoice(newInvoiceData);
      this.notificationService.addNotification({ type: 'success', title: 'تم إنشاء الفاتورة', message: `تم إنشاء فاتورة جديدة بنجاح.`});
      this.printModal();
      this.closeModal();
  }

  savePaymentReceipt() {
      if (this.paymentReceiptForm.invalid) {
          this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء جميع الحقول المطلوبة.' });
          return;
      }
      const formValue = this.paymentReceiptForm.getRawValue();
      const newReceiptData: Omit<PaymentReceipt, 'id'> = {
          clientId: formValue.clientId!,
          clientName: this.clients().find(c => c.id === formValue.clientId)?.nameAr,
          date: formValue.date!,
          amount: formValue.amount!,
          amountInWords: this.numberToWords(formValue.amount!),
          paymentMethod: formValue.paymentMethod!,
          chequeDetails: formValue.paymentMethod === 'Cheque' ? { no: formValue.chequeNo!, date: formValue.chequeDate!, bank: formValue.chequeBank! } : undefined,
          description: formValue.description!,
      };
       this.dataHubService.financial.addPaymentReceipt(newReceiptData);
      this.notificationService.addNotification({ type: 'success', title: 'تم إنشاء سند القبض', message: `تم إنشاء سند قبض جديد بنجاح.`});
      this.printModal();
      this.closeModal();
  }
  
  saveBill() {
    if (this.billForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء الحقول المطلوبة.' });
      return;
    }
    const formValue = this.billForm.getRawValue();
    const newBillData: Omit<Bill, 'id'> = {
      clientId: formValue.clientId!,
      clientName: this.clients().find(c => c.id === formValue.clientId)?.nameAr,
      caseId: formValue.caseId || undefined,
      date: formValue.date!,
      items: formValue.items as BillItem[],
      totalAmount: this.billTotals().totalAmount
    };
    this.dataHubService.financial.addBill(newBillData);
    this.notificationService.addNotification({ type: 'success', title: 'تم الحفظ', message: 'تم حفظ فاتورة المصروفات بنجاح.' });
    this.printModal();
    this.closeModal();
  }
  
  saveBillPayment() {
    if (this.billPaymentForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء الحقول المطلوبة.' });
      return;
    }
    const formValue = this.billPaymentForm.getRawValue();
    const newPaymentData: Omit<BillPayment, 'id'> = {
      paidTo: formValue.paidTo!,
      date: formValue.date!,
      amount: formValue.amount!,
      amountInWords: this.numberToWords(formValue.amount!),
      paymentMethod: formValue.paymentMethod!,
      chequeDetails: formValue.paymentMethod === 'Cheque' ? { no: formValue.chequeNo!, date: formValue.chequeDate!, bank: formValue.chequeBank! } : undefined,
      description: formValue.description!,
    };
    this.dataHubService.financial.addBillPayment(newPaymentData);
    this.notificationService.addNotification({ type: 'success', title: 'تم الحفظ', message: 'تم حفظ سند الصرف بنجاح.' });
    this.printModal();
    this.closeModal();
  }

  saveCourtFee() {
    if (this.courtFeeForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء الحقول المطلوبة.' });
      return;
    }
    const formValue = this.courtFeeForm.getRawValue();
    const newFeeData: Omit<CourtFee, 'id'> = {
      clientId: formValue.clientId!,
      clientName: this.clients().find(c => c.id === formValue.clientId)?.nameAr,
      caseId: formValue.caseId || undefined,
      court: formValue.court!,
      date: formValue.date!,
      items: formValue.items as TransactionItem[],
      totalAmount: this.courtFeeTotals().totalAmount,
    };
    this.dataHubService.financial.addCourtFee(newFeeData);
    this.notificationService.addNotification({ type: 'success', title: 'تم الحفظ', message: 'تم حفظ الرسوم القضائية بنجاح.' });
    this.printModal();
    this.closeModal();
  }

  saveDepositRecord() {
    if (this.depositRecordForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء جميع الحقول المطلوبة في حافظة الإيداع.' });
      return;
    }
    const formValue = this.depositRecordForm.getRawValue();
    const newRecordData: Omit<DepositRecord, 'id'> = {
      date: formValue.date!,
      bankAccountName: formValue.bankAccountName!,
      items: formValue.items as any[],
      totalAmount: this.depositTotals().totalAmount,
    };
    this.dataHubService.financial.addDepositRecord(newRecordData);
    this.notificationService.addNotification({ type: 'success', title: 'تم الحفظ', message: `تم حفظ حافظة إيداع جديدة بنجاح.` });
    this.printModal();
    this.closeModal();
  }

  saveBankAccount() {
    if (this.bankAccountForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء جميع الحقول المطلوبة.' });
      return;
    }
    const formValue = this.bankAccountForm.getRawValue();
    const accountData: BankAccount = formValue as BankAccount;
    
    const editingAccount = this.editingBankAccount();
    if (editingAccount) {
      this.dataHubService.financial.updateBankAccount({ ...editingAccount, ...accountData });
      this.notificationService.addNotification({ type: 'success', title: 'تم التحديث', message: `تم تحديث الحساب البنكي "${accountData.name}"` });
    } else {
      if (this.bankAccounts().some(acc => acc.accountNumber === accountData.accountNumber)) {
        this.notificationService.addNotification({ type: 'alert', title: 'خطأ', message: 'رقم الحساب موجود بالفعل.' });
        return;
      }
      this.dataHubService.financial.addBankAccount(accountData);
      this.notificationService.addNotification({ type: 'success', title: 'تمت الإضافة', message: `تمت إضافة حساب "${accountData.name}" بنجاح.` });
    }
    this.closeModal();
  }

  deleteBankAccount(account: BankAccount) {
    if (confirm(`هل أنت متأكد من حذف حساب "${account.name}"؟`)) {
      this.dataHubService.financial.deleteBankAccount(account.accountNumber);
      this.notificationService.addNotification({ type: 'success', title: 'تم الحذف', message: 'تم حذف الحساب البنكي.' });
    }
  }

  savePettyCashHolder() {
    if (this.pettyCashHolderForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء جميع الحقول المطلوبة.' });
      return;
    }
    const formValue = this.pettyCashHolderForm.getRawValue();
    const holderData: PettyCashHolder = formValue as PettyCashHolder;
    
    const editingHolder = this.editingPettyCashHolder();
    if (editingHolder) {
      this.dataHubService.financial.updatePettyCashHolder({ ...editingHolder, ...holderData });
      this.notificationService.addNotification({ type: 'success', title: 'تم التحديث', message: `تم تحديث عهدة "${holderData.name}"` });
    } else {
      if (this.pettyCashHolders().some(h => h.name === holderData.name)) {
        this.notificationService.addNotification({ type: 'alert', title: 'خطأ', message: 'اسم حامل العهدة موجود بالفعل.' });
        return;
      }
      this.dataHubService.financial.addPettyCashHolder(holderData);
      this.notificationService.addNotification({ type: 'success', title: 'تمت الإضافة', message: `تمت إضافة عهدة لـ "${holderData.name}" بنجاح.` });
    }
    this.closeModal();
  }

  deletePettyCashHolder(holder: PettyCashHolder) {
    if (confirm(`هل أنت متأكد من حذف عهدة "${holder.name}"؟`)) {
      this.dataHubService.financial.deletePettyCashHolder(holder.name);
      this.notificationService.addNotification({ type: 'success', title: 'تم الحذف', message: 'تم حذف حامل العهدة.' });
    }
  }

  printModal() {
    window.print();
  }

  clearStatement() {
    this.statementData.set(null);
    this.statementSelectionForm.reset();
  }

  generateStatement() {
    if (this.statementSelectionForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى اختيار العميل.' });
      return;
    }

    const { clientId, fromDate, toDate } = this.statementSelectionForm.value;
    const client = this.clients().find(c => c.id === clientId);
    if (!client) return;

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);

    const allTransactions: StatementTransaction[] = [];

    // Invoices, Bills, Court Fees are debits
    this.dataHubService.financial.invoices().filter(i => i.clientId === clientId).forEach(i => allTransactions.push({ date: i.date, reference: i.id, description: `فاتورة أتعاب - قضية ${i.caseId || ''}`, debit: i.grandTotal, credit: 0 }));
    this.dataHubService.financial.bills().filter(b => b.clientId === clientId).forEach(b => allTransactions.push({ date: b.date, reference: b.id, description: `فاتورة مصروفات - قضية ${b.caseId || ''}`, debit: b.totalAmount, credit: 0 }));
    this.dataHubService.financial.courtFees().filter(cf => cf.clientId === clientId).forEach(cf => allTransactions.push({ date: cf.date, reference: cf.id, description: `رسوم قضائية - ${cf.court}`, debit: cf.totalAmount, credit: 0 }));

    // Payment Receipts are credits
    this.dataHubService.financial.paymentReceipts().filter(pr => pr.clientId === clientId).forEach(pr => allTransactions.push({ date: pr.date, reference: pr.id, description: `سند قبض - ${pr.description}`, debit: 0, credit: pr.amount }));
      
    allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let openingBalance = 0;
    const transactionsInPeriod: StatementTransaction[] = [];

    for (const trans of allTransactions) {
        const transDate = new Date(trans.date);
        if (from && transDate < from) {
            openingBalance += (trans.debit - trans.credit);
        } else if ((!from || transDate >= from) && (!to || transDate <= to)) {
            transactionsInPeriod.push(trans);
        }
    }
    
    let currentBalance = openingBalance;
    const processedTransactions = transactionsInPeriod.map(trans => {
      currentBalance += (trans.debit - trans.credit);
      return { ...trans, balance: currentBalance };
    });
    
    const totalDebit = transactionsInPeriod.reduce((sum, t) => sum + t.debit, 0);
    const totalCredit = transactionsInPeriod.reduce((sum, t) => sum + t.credit, 0);

    this.statementData.set({ client, transactions: processedTransactions, openingBalance, closingBalance: currentBalance, totalDebit, totalCredit });
  }

  // Basic number to words for demonstration
  numberToWords(num: number): string {
    // This is a simplified implementation. A full library would be needed for production.
    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    if (num === 0) return 'صفر';
    return `${ones[Math.floor(num / 1000)] || ''} آلاف و ${ones[Math.floor((num % 1000) / 100)] || ''} مئة و ${ones[num % 10] || ''} ... درهم`;
  }
}