import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule, FormGroup } from '@angular/forms';
import { DataHubService } from '../../services/data-hub.service';
import { Client } from '../../services/client.service';
import { Employee } from '../../services/hr.service';
import { NotificationService } from '../../services/notification.service';
import { CustomerRequest } from '../../services/customer-request.service';

@Component({
  selector: 'app-customer-requests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer-requests.component.html',
  providers: [DatePipe]
})
export class CustomerRequestsComponent {
  private dataHubService = inject(DataHubService);
  private notificationService = inject(NotificationService);
  private fb: FormBuilder = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  readonly requestTypes: CustomerRequest['requestType'][] = ['طلب مستند', 'استفسار عن قضية', 'طلب تقرير', 'أخرى'];
  readonly statusOptions: CustomerRequest['status'][] = ['جديد', 'قيد المراجعة', 'تم التنفيذ', 'مغلق'];
  readonly statusFilterOptions: ('all' | CustomerRequest['status'])[] = ['all', 'جديد', 'قيد المراجعة', 'تم التنفيذ', 'مغلق'];

  isModalVisible = signal(false);
  editingRequest = signal<CustomerRequest | null>(null);
  searchTerm = signal('');
  statusFilter = signal<'all' | CustomerRequest['status']>('all');
  
  private requests = this.dataHubService.customerRequests.requests;

  requestForm = this.fb.group({
    clientId: [null as number | null, Validators.required],
    requestType: ['طلب مستند' as CustomerRequest['requestType'], Validators.required],
    requestDate: ['', Validators.required],
    assignedTo: [null as number | null, Validators.required],
    status: ['جديد' as CustomerRequest['status'], Validators.required],
    caseId: [''],
    details: ['', Validators.required],
  });
  
  get allClients(): Client[] {
    return this.dataHubService.clients.clients();
  }
  get allEmployees(): Employee[] {
    return this.dataHubService.hr.employees();
  }
  
  filteredRequests = computed(() => {
    try {
      const term = this.searchTerm().toLowerCase();
      const status = this.statusFilter();
      
      return this.requests().filter(req => {
        const clientName = this.getClientName(req.clientId).toLowerCase();
        const employeeName = this.getEmployeeName(req.assignedTo).toLowerCase();

        const statusMatch = status === 'all' || req.status === status;
        const termMatch = !term || 
          clientName.includes(term) || 
          employeeName.includes(term) ||
          req.details.toLowerCase().includes(term) ||
          req.requestType.toLowerCase().includes(term) ||
          (req.caseId && req.caseId.toLowerCase().includes(term));

        return statusMatch && termMatch;
      });
    } catch (error) {
      console.error('Error filtering requests:', error);
      return [];
    }
  });

  statistics = computed(() => {
    return this.requests().reduce((acc, req) => {
        acc.total++;
        switch(req.status) {
            case 'جديد': acc.new++; break;
            case 'قيد المراجعة': acc.inReview++; break;
            case 'تم التنفيذ': acc.completed++; break;
            case 'مغلق': acc.closed++; break;
        }
        return acc;
    }, { total: 0, new: 0, inReview: 0, completed: 0, closed: 0 });
  });

  openModal(request: CustomerRequest | null = null) {
    this.requestForm.reset({
      requestType: 'طلب مستند',
      status: 'جديد',
      requestDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd')
    });
    this.editingRequest.set(request);
    if (request) {
      this.requestForm.patchValue(request);
    }
    this.isModalVisible.set(true);
  }

  closeModal() {
    this.isModalVisible.set(false);
    this.editingRequest.set(null);
    this.requestForm.reset({
      requestType: 'طلب مستند',
      status: 'جديد',
      requestDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd')
    });
  }
  
  onSubmit() {
    try {
      if (this.requestForm.invalid) {
        this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء جميع الحقول الإلزامية.' });
        this.markFormGroupTouched(this.requestForm);
        return;
      }
      
      const formValue = this.requestForm.getRawValue();
      const editing = this.editingRequest();

      const requestData: Omit<CustomerRequest, 'id'> = {
          clientId: formValue.clientId!,
          requestType: formValue.requestType!,
          requestDate: formValue.requestDate!,
          assignedTo: formValue.assignedTo!,
          status: formValue.status!,
          caseId: formValue.caseId || undefined,
          details: formValue.details!
      };

      if (editing) {
        const updatedData: CustomerRequest = { ...editing, ...requestData };
        this.dataHubService.customerRequests.updateRequest(updatedData);
        this.notificationService.addNotification({ type: 'success', title: 'تم التحديث', message: `تم تحديث الطلب رقم ${updatedData.id}.` });
      } else {
        this.dataHubService.customerRequests.addRequest(requestData);
        this.notificationService.addNotification({ type: 'success', title: 'تمت الإضافة', message: 'تمت إضافة طلب جديد بنجاح.' });
      }
      
      this.closeModal();
    } catch(error) {
      console.error('Error submitting request form:', error);
      this.notificationService.addNotification({ type: 'alert', title: 'خطأ', message: 'حدث خطأ غير متوقع أثناء حفظ الطلب.' });
    }
  }

  deleteRequest(id: number) {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        try {
            this.dataHubService.customerRequests.deleteRequest(id);
            this.notificationService.addNotification({ type: 'success', title: 'تم الحذف', message: 'تم حذف الطلب بنجاح.' });
        } catch (error) {
            console.error('Error deleting request:', error);
            this.notificationService.addNotification({ type: 'alert', title: 'خطأ', message: 'لم يتم حذف الطلب.' });
        }
    }
  }

  getClientName(id: number | null): string {
    if (id === null) return 'غير محدد';
    return this.allClients.find(c => c.id === id)?.nameAr || 'عميل غير معروف';
  }

  getEmployeeName(id: number | null): string {
    if (id === null) return 'غير محدد';
    return this.allEmployees.find(e => e.id === id)?.name || 'موظف غير معروف';
  }
  
  getStatusClass(status: CustomerRequest['status']): string {
    switch (status) {
      case 'جديد': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'قيد المراجعة': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'تم التنفيذ': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'مغلق': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return '';
    }
  }

  getStatusIcon(status: CustomerRequest['status']): string {
    switch (status) {
      case 'جديد': return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'قيد المراجعة': return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'تم التنفيذ': return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'مغلق': return 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4';
      default: return '';
    }
  }
  
  exportData() {
    this.notificationService.addNotification({
        type: 'info',
        title: 'قيد التنفيذ',
        message: 'سيتم تنفيذ وظيفة تصدير البيانات قريبًا.'
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
