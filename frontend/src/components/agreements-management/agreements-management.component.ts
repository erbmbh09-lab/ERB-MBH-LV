import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule, FormArray, FormGroup } from '@angular/forms';
import { DataHubService } from '../../services/data-hub.service';
import { Agreement, Quote, QuoteItem, AgreementEmail } from '../../services/agreement.service';
import { Client } from '../../services/client.service';
import { NotificationService } from '../../services/notification.service';
import { FileUploadComponent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-agreements-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FileUploadComponent],
  templateUrl: './agreements-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class AgreementsManagementComponent {
  dataHubService = inject(DataHubService);
  notificationService = inject(NotificationService);
  private fb: FormBuilder = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  isModalVisible = signal(false);
  editingAgreement = signal<Agreement | null>(null);
  selectedAgreementDetails = signal<Agreement | null>(null); // For detail view
  
  searchTerm = signal('');
  statusFilter = signal<'all' | 'مسودة' | 'مرسلة' | 'مقبولة' | 'منتهية'>('all');

  // Forms
  agreementForm = this.fb.group({
    clientId: [null as number | null, Validators.required],
    type: ['عادية' as Agreement['type'], Validators.required],
    status: ['مسودة' as Agreement['status'], Validators.required],
    startDate: ['', Validators.required],
    endDate: [''],
    details: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0)]],
  });

  quoteForm = this.fb.group({
    status: ['مسودة' as Quote['status'], Validators.required],
    items: this.fb.array([this.createQuoteItem()]),
  });

  emailForm = this.fb.group({
      subject: ['', Validators.required],
      body: ['', Validators.required]
  });

  allAgreements = this.dataHubService.agreements.agreements;
  allClients = this.dataHubService.clients.clients;

  filteredAgreements = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    return this.allAgreements().filter(agreement => {
      const statusMatch = status === 'all' || agreement.status === status;
      const clientName = this.getClientName(agreement.clientId).toLowerCase();
      const termMatch = term === '' || clientName.includes(term) || agreement.details.toLowerCase().includes(term);
      return statusMatch && termMatch;
    });
  });

  agreementQuotes = computed(() => {
    const agreement = this.selectedAgreementDetails();
    if (!agreement) return [];
    return this.dataHubService.agreements.quotes().filter(q => q.agreementId === agreement.id);
  });

  agreementEmails = computed(() => {
    const agreement = this.selectedAgreementDetails();
    if (!agreement) return [];
    return this.dataHubService.agreements.agreementEmails().filter(e => e.agreementId === agreement.id);
  });

  get quoteItems() {
    return this.quoteForm.get('items') as FormArray;
  }

  createQuoteItem(item?: QuoteItem): FormGroup {
    const group = this.fb.group({
        description: [item?.description || '', Validators.required],
        quantity: [item?.quantity || 1, [Validators.required, Validators.min(1)]],
        unitPrice: [item?.unitPrice || 0, [Validators.required, Validators.min(0)]],
        total: [{ value: item?.total || 0, disabled: true }]
    });
    
    group.get('quantity')?.valueChanges.subscribe(() => this.updateQuoteItemTotal(group));
    group.get('unitPrice')?.valueChanges.subscribe(() => this.updateQuoteItemTotal(group));

    return group;
  }
  
  updateQuoteItemTotal(group: FormGroup) {
    const qty = group.get('quantity')?.value || 0;
    const price = group.get('unitPrice')?.value || 0;
    group.get('total')?.setValue(qty * price, { emitEvent: false });
  }

  addQuoteItem() {
    this.quoteItems.push(this.createQuoteItem());
  }

  removeQuoteItem(index: number) {
    this.quoteItems.removeAt(index);
  }

  quoteTotal = computed(() => {
    return this.quoteForm.getRawValue().items.reduce((sum, item) => sum + (item.total || 0), 0);
  });

  openModal(agreement: Agreement | null = null) {
    this.agreementForm.reset({
      type: 'عادية',
      status: 'مسودة',
      startDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd'),
      amount: 0
    });
    this.editingAgreement.set(agreement);
    if (agreement) {
      this.agreementForm.patchValue(agreement);
    }
    this.isModalVisible.set(true);
  }
  
  closeModal() {
    this.isModalVisible.set(false);
    this.editingAgreement.set(null);
  }

  viewDetails(agreement: Agreement) {
      this.selectedAgreementDetails.set(agreement);
  }

  closeDetails() {
      this.selectedAgreementDetails.set(null);
      this.quoteForm.reset({ status: 'مسودة' });
      if (this.quoteItems) {
        this.quoteItems.clear();
        this.addQuoteItem();
      }
      this.emailForm.reset();
  }

  onAgreementSubmit() {
    if (this.agreementForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء جميع الحقول الإلزامية.' });
      return;
    }
    
    const formValue = this.agreementForm.getRawValue();
    const editing = this.editingAgreement();

    if (editing) {
      const updatedData: Agreement = { ...editing, ...(formValue as any) };
      this.dataHubService.agreements.updateAgreement(updatedData);
      this.notificationService.addNotification({ type: 'success', title: 'تم التحديث', message: `تم تحديث الاتفاقية.` });
    } else {
      this.dataHubService.agreements.addAgreement(formValue as Omit<Agreement, 'id'>);
      this.notificationService.addNotification({ type: 'success', title: 'تمت الإضافة', message: 'تمت إضافة اتفاقية جديدة.' });
    }
    
    this.closeModal();
  }

  onQuoteSubmit() {
    const agreement = this.selectedAgreementDetails();
    if (!agreement || this.quoteForm.invalid) return;

    const formValue = this.quoteForm.getRawValue();
    const newQuote: Omit<Quote, 'id'> = {
        agreementId: agreement.id,
        date: new Date().toISOString().split('T')[0],
        status: formValue.status!,
        items: formValue.items as QuoteItem[],
        totalAmount: this.quoteTotal()
    };
    this.dataHubService.agreements.addQuote(newQuote);
    this.notificationService.addNotification({ type: 'success', title: 'تم إضافة عرض سعر', message: 'تم حفظ عرض السعر الجديد للاتفاقية.' });
    this.quoteForm.reset({ status: 'مسودة' });
    this.quoteItems.clear();
    this.addQuoteItem();
  }

  onEmailSubmit() {
      const agreement = this.selectedAgreementDetails();
      if (!agreement || this.emailForm.invalid) return;

      const formValue = this.emailForm.value;
      const newEmail: Omit<AgreementEmail, 'id'> = {
          agreementId: agreement.id,
          direction: 'مرسلة',
          subject: formValue.subject!,
          body: formValue.body!,
          date: new Date().toISOString()
      };
      this.dataHubService.agreements.addAgreementEmail(newEmail);
      this.notificationService.addNotification({ type: 'success', title: 'تم إرسال البريد', message: 'تم حفظ البريد الإلكتروني المرسل.' });
      this.emailForm.reset();
  }

  getClientName(id: number): string {
    return this.allClients().find(c => c.id === id)?.nameAr || 'غير معروف';
  }

  getStatusClass(status: Agreement['status']): string {
    switch (status) {
      case 'مسودة': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'مرسلة': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'مقبولة': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'منتهية': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default: return '';
    }
  }
}