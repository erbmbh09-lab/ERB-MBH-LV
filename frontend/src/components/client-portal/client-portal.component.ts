import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DataHubService } from '../../services/data-hub.service';
import { Client } from '../../services/client.service';
import { Case, Session, Document as CaseDocument } from '../../services/case.service';
import { Invoice } from '../../services/financial.service';
import { NotificationService } from '../../services/notification.service';
import { CustomerRequest } from '../../services/customer-request.service';

@Component({
  selector: 'app-client-portal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-portal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class ClientPortalComponent {
  dataHubService = inject(DataHubService);
  notificationService = inject(NotificationService);
  private fb: FormBuilder = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  // For demonstration, we hardcode the logged-in client's ID.
  // In a real app, this would come from an authentication service.
  private loggedInClientId = 7607;
  
  lastLoginDate = new Date();

  activeTab = signal<'cases' | 'documents' | 'invoices' | 'my-requests' | 'contact'>('cases');
  isCaseModalVisible = signal(false);
  selectedCase = signal<Case | null>(null);

  contactForm = this.fb.group({
    subject: ['', Validators.required],
    message: ['', Validators.required],
  });

  loggedInClient = computed(() => {
    return this.dataHubService.clients.clients().find(c => c.id === this.loggedInClientId);
  });

  clientCases = computed(() => {
    const client = this.loggedInClient();
    if (!client) return [];
    return this.dataHubService.cases.cases().filter(c => c.parties?.some(p => p.clientId === client.id));
  });
  
  clientInvoices = computed(() => {
    const client = this.loggedInClient();
    if (!client) return [];
    return this.dataHubService.financial.invoices().filter(i => i.clientId === client.id);
  });

  clientRequests = computed(() => {
    const client = this.loggedInClient();
    if (!client) return [];
    return this.dataHubService.customerRequests.requests().filter(r => r.clientId === client.id);
  });

  clientDocuments = computed(() => {
    const cases = this.clientCases();
    const docs: (CaseDocument & { caseId: string })[] = [];
    for (const c of cases) {
      c.documents?.forEach(doc => {
        if (doc.sharedWithClient) {
          docs.push({ ...doc, caseId: c.id });
        }
      });
    }
    return docs;
  });

  sessionsForSelectedCase = computed(() => {
    const caseItem = this.selectedCase();
    if (!caseItem) return [];
    return this.dataHubService.cases.sessions()
      .filter(s => s.caseId === caseItem.id)
      .sort((a,b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  });
  
  openCaseModal(caseItem: Case) {
    this.selectedCase.set(caseItem);
    this.isCaseModalVisible.set(true);
  }

  closeCaseModal() {
    this.isCaseModalVisible.set(false);
    this.selectedCase.set(null);
  }

  sendMessage() {
    if (this.contactForm.invalid) {
      this.notificationService.addNotification({
        type: 'alert', title: 'بيانات غير كاملة', message: 'الرجاء إدخال موضوع ورسالة.'
      });
      return;
    }
    const formValue = this.contactForm.value;
    const client = this.loggedInClient();
    if (!client) return;

    // Create a new customer request
    const newRequest: Omit<CustomerRequest, 'id'> = {
        clientId: client.id,
        requestDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd')!,
        requestType: 'استفسار عن قضية', // Default type from portal
        subject: formValue.subject!,
        details: formValue.message!,
        status: 'جديد',
        assignedTo: 104, // Default assignment to a secretary (e.g., Fatima)
    };
    
    this.dataHubService.customerRequests.addRequest(newRequest);
    
    this.notificationService.addNotification({
      type: 'success', title: 'تم الإرسال', message: 'تم استلام رسالتك كطلب جديد. يمكنك متابعة حالته من تبويب "طلباتي".'
    });
    this.contactForm.reset();
    this.activeTab.set('my-requests');
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'مفتوحة': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'قيد التنفيذ': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'معلقة': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'مغلقة': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'جديد': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'قيد المراجعة': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'تم التنفيذ': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      default: return '';
    }
  }

  getInvoiceStatusClass(status: Invoice['status']): string {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'unpaid': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    }
  }

  getInvoiceStatusText(status: Invoice['status']): string {
    return { paid: 'مدفوعة', unpaid: 'غير مدفوعة', overdue: 'متأخرة' }[status];
  }

}