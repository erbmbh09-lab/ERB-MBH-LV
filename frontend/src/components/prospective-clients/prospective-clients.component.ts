import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { DataHubService } from '../../services/data-hub.service';
import { ProspectiveClient } from '../../services/client.service';
import { Employee } from '../../services/hr.service';
import { NotificationService } from '../../services/notification.service';
import { FileUploadComponent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-prospective-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FileUploadComponent],
  templateUrl: './prospective-clients.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class ProspectiveClientsComponent {
  dataHubService = inject(DataHubService);
  notificationService = inject(NotificationService);
  // FIX: Explicitly type `fb` as `FormBuilder` to resolve type inference errors on `.group()`.
  private fb: FormBuilder = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  isModalVisible = signal(false);
  editingLead = signal<ProspectiveClient | null>(null);
  searchTerm = signal('');
  statusFilter = signal<'all' | 'جديد' | 'تم التواصل' | 'مؤهل' | 'غير مؤهل' | 'تحول لموكل'>('all');

  leadForm = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.email]],
    source: ['إحالة' as ProspectiveClient['source'], Validators.required],
    status: ['جديد' as ProspectiveClient['status'], Validators.required],
    assignedTo: [null as number | null, Validators.required],
    notes: [''],
    entryDate: ['', Validators.required],
    followUpDate: ['']
  });

  allLeads = this.dataHubService.clients.prospectiveClients;
  allEmployees = this.dataHubService.hr.employees;

  filteredLeads = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    
    return this.allLeads().filter(lead => {
      const statusMatch = status === 'all' || lead.status === status;
      const termMatch = !term || lead.name.toLowerCase().includes(term) || lead.phone.includes(term);
      return statusMatch && termMatch;
    });
  });

  stats = computed(() => {
    return this.allLeads().reduce((acc, lead) => {
      acc.total++;
      if (lead.status === 'جديد') acc.new++;
      if (lead.status === 'تم التواصل') acc.contacted++;
      if (lead.status === 'تحول لموكل') acc.converted++;
      return acc;
    }, { total: 0, new: 0, contacted: 0, converted: 0 });
  });

  openModal(lead: ProspectiveClient | null = null) {
    this.leadForm.reset({
      source: 'إحالة',
      status: 'جديد',
      entryDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd')
    });
    this.editingLead.set(lead);
    if (lead) {
      this.leadForm.patchValue(lead);
    }
    this.isModalVisible.set(true);
  }

  closeModal() {
    this.isModalVisible.set(false);
    this.editingLead.set(null);
  }

  onSubmit() {
    if (this.leadForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء جميع الحقول الإلزامية.' });
      return;
    }
    
    const formValue = this.leadForm.getRawValue();
    const editing = this.editingLead();

    if (editing) {
      const updatedData: ProspectiveClient = { ...editing, ...(formValue as any) };
      this.dataHubService.clients.updateProspectiveClient(updatedData);
      this.notificationService.addNotification({ type: 'success', title: 'تم التحديث', message: `تم تحديث بيانات العميل المحتمل.` });
    } else {
      this.dataHubService.clients.addProspectiveClient(formValue as Omit<ProspectiveClient, 'id'>);
      this.notificationService.addNotification({ type: 'success', title: 'تمت الإضافة', message: 'تمت إضافة عميل محتمل جديد.' });
    }
    
    this.closeModal();
  }
  
  deleteLead(id: number) {
    if (confirm('هل أنت متأكد من حذف هذا العميل المحتمل؟')) {
      this.dataHubService.clients.deleteProspectiveClient(id);
      this.notificationService.addNotification({ type: 'success', title: 'تم الحذف', message: 'تم حذف العميل المحتمل.' });
    }
  }

  getEmployeeName(id: number | null | undefined): string {
    if (!id) return 'غير معين';
    return this.allEmployees().find(e => e.id === id)?.name || 'غير معروف';
  }

  getStatusClass(status: ProspectiveClient['status']): string {
    switch (status) {
      case 'جديد': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'تم التواصل': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'مؤهل': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300';
      case 'غير مؤهل': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'تحول لموكل': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      default: return '';
    }
  }
}