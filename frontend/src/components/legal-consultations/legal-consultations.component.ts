import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { DataHubService } from '../../services/data-hub.service';
import { LegalConsultation } from '../../services/consultation.service';
import { Client } from '../../services/client.service';
import { Employee } from '../../services/hr.service';
import { NotificationService } from '../../services/notification.service';

// FIX: Define explicit types for the complex report data structure to aid TypeScript's type inference.
// This resolves errors where properties were being accessed on objects inferred as `unknown`.
type ReportConsultants = { [consultantName: string]: number };
type ReportBranch = { total: number; consultants: ReportConsultants };
type ReportMonth = { total: number; branches: { [branch: string]: ReportBranch } };
type MonthlyReportData = { [month: string]: ReportMonth };

@Component({
  selector: 'app-legal-consultations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './legal-consultations.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class LegalConsultationsComponent {
  dataHubService = inject(DataHubService);
  notificationService = inject(NotificationService);
  // FIX: Explicitly type `fb` as `FormBuilder` to resolve type inference errors on `.group()`.
  private fb: FormBuilder = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  isModalVisible = signal(false);
  editingConsultation = signal<LegalConsultation | null>(null);
  searchTerm = signal('');
  statusFilter = signal<'all' | 'جديدة' | 'مكتملة' | 'تحولت لقضية'>('all');
  activeTab = signal<'list' | 'reports'>('list');

  // Report filters
  reportBranchFilter = signal<string>('all');
  reportFromDateFilter = signal<string>('');
  reportToDateFilter = signal<string>('');
  isReportExpanded = signal(false);

  consultationForm = this.fb.group({
    clientId: [null as number | null, Validators.required],
    consultationDate: ['', Validators.required],
    consultantId: [null as number | null, Validators.required],
    subject: ['', Validators.required],
    details: ['', Validators.required],
    status: ['جديدة' as LegalConsultation['status'], Validators.required],
    fees: [0],
    relatedCaseId: ['']
  });
  
  // FIX: Access consultations through the correctly typed `dataHubService.consultations` property.
  allConsultations = this.dataHubService.consultations.consultations;
  // FIX: Access clients through the correctly typed `dataHubService.clients` property.
  allClients = this.dataHubService.clients.clients;
  // FIX: Access employees through the correctly typed `dataHubService.hr` property.
  allEmployees = this.dataHubService.hr.employees;
  
  consultants = computed(() => this.allEmployees().filter(e => e.role.includes('محامي') || e.role.includes('مستشار قانوني')));

  availableBranches = computed(() => {
    // FIX: Access cases through the correctly typed `dataHubService.cases` property.
    const branches = this.dataHubService.cases.cases().map(c => c.branch);
    return [...new Set(branches)];
  });

  filteredConsultations = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    const clients = this.allClients();
    const consultants = this.allEmployees();

    return this.allConsultations().filter(consultation => {
      const statusMatch = status === 'all' || consultation.status === status;
      
      const clientName = clients.find(c => c.id === consultation.clientId)?.nameAr || '';
      const consultantName = consultants.find(c => c.id === consultation.consultantId)?.name || '';

      const termMatch = !term ||
        consultation.subject.toLowerCase().includes(term) ||
        clientName.toLowerCase().includes(term) ||
        consultantName.toLowerCase().includes(term);
        
      return statusMatch && termMatch;
    });
  });

  stats = computed(() => {
    return this.allConsultations().reduce((acc, c) => {
      acc.total++;
      if (c.status === 'جديدة') acc.new++;
      if (c.status === 'مكتملة') acc.completed++;
      if (c.status === 'تحولت لقضية') acc.converted++;
      return acc;
    }, { total: 0, new: 0, completed: 0, converted: 0 });
  });

  monthlyReport = computed(() => {
    const consultations = this.allConsultations();
    // FIX: Access cases through the correctly typed `dataHubService.cases` property.
    const cases = this.dataHubService.cases.cases();
    
    // Filters
    const branchFilter = this.reportBranchFilter();
    const fromDate = this.reportFromDateFilter() ? new Date(this.reportFromDateFilter()) : null;
    const toDate = this.reportToDateFilter() ? new Date(this.reportToDateFilter()) : null;

    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    if (toDate) toDate.setHours(23, 59, 59, 999);

    const consultationsWithBranch = consultations.map(consultation => {
        let branch = 'فرع غير محدد';
        const relatedCase = consultation.relatedCaseId ? cases.find(c => c.id === consultation.relatedCaseId) : undefined;

        if (relatedCase) {
            branch = relatedCase.branch;
        } else {
            const clientCase = cases.find(c => c.parties?.some(p => p.clientId === consultation.clientId));
            if (clientCase) {
                branch = clientCase.branch;
            }
        }
        return { ...consultation, branch };
    });

    const filteredReportConsultations = consultationsWithBranch.filter(consultation => {
        const consultationDate = new Date(consultation.consultationDate);
        const branchMatch = branchFilter === 'all' || consultation.branch === branchFilter;
        const dateMatch = (!fromDate || consultationDate >= fromDate) && (!toDate || consultationDate <= toDate);
        return branchMatch && dateMatch;
    });

    // FIX: Explicitly typed the accumulator in the reduce function to ensure correct type inference for `reportData`, resolving multiple errors where properties were being accessed on `unknown` types.
    const reportData = filteredReportConsultations.reduce((acc: MonthlyReportData, consultation) => {
      const month = this.datePipe.transform(consultation.consultationDate, 'yyyy-MM');
      if (!month) return acc;

      const consultantName = this.getEmployeeName(consultation.consultantId);

      if (!acc[month]) {
        acc[month] = { total: 0, branches: {} };
      }

      acc[month].total++;
      
      if (!acc[month].branches[consultation.branch]) {
        acc[month].branches[consultation.branch] = { total: 0, consultants: {} };
      }

      acc[month].branches[consultation.branch].total++;
      acc[month].branches[consultation.branch].consultants[consultantName] = (acc[month].branches[consultation.branch].consultants[consultantName] || 0) + 1;


      return acc;
    }, {} as MonthlyReportData);

    return Object.entries(reportData)
      .map(([month, data]) => ({
        month,
        total: data.total,
        branches: Object.entries(data.branches)
          .map(([name, branchData]) => ({ 
            name, 
            count: branchData.total,
            consultants: Object.entries(branchData.consultants)
              .map(([consultantName, count]) => ({ name: consultantName, count }))
              .sort((a,b) => b.count - a.count)
          }))
          .sort((a,b) => b.count - a.count)
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  });

  openModal(consultation: LegalConsultation | null = null) {
    this.consultationForm.reset({
      status: 'جديدة',
      consultationDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd'),
      fees: 0
    });
    this.editingConsultation.set(consultation);
    if (consultation) {
      this.consultationForm.patchValue(consultation);
    }
    this.isModalVisible.set(true);
  }

  closeModal() {
    this.isModalVisible.set(false);
    this.editingConsultation.set(null);
  }
  
  onSubmit() {
    if (this.consultationForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء جميع الحقول الإلزامية.' });
      return;
    }
    
    const formValue = this.consultationForm.getRawValue() as Omit<LegalConsultation, 'id'>;
    const editing = this.editingConsultation();

    if (editing) {
      const updatedData: LegalConsultation = { ...editing, ...formValue };
      // FIX: Access updateConsultation through the correctly typed `dataHubService.consultations` property.
      this.dataHubService.consultations.updateConsultation(updatedData);
      this.notificationService.addNotification({ type: 'success', title: 'تم التحديث', message: `تم تحديث الاستشارة "${updatedData.subject}".` });
    } else {
      // FIX: Access addConsultation through the correctly typed `dataHubService.consultations` property.
      this.dataHubService.consultations.addConsultation(formValue);
      this.notificationService.addNotification({ type: 'success', title: 'تمت الإضافة', message: `تمت إضافة استشارة جديدة.` });
    }
    
    this.closeModal();
  }
  
  deleteConsultation(id: number) {
      if (confirm('هل أنت متأكد من حذف هذه الاستشارة؟')) {
          // FIX: Access deleteConsultation through the correctly typed `dataHubService.consultations` property.
          this.dataHubService.consultations.deleteConsultation(id);
          this.notificationService.addNotification({ type: 'success', title: 'تم الحذف', message: 'تم حذف الاستشارة بنجاح.' });
      }
  }

  getClientName(id: number): string {
    return this.allClients().find(c => c.id === id)?.nameAr || 'غير معروف';
  }

  getEmployeeName(id: number): string {
    return this.allEmployees().find(e => e.id === id)?.name || 'غير معروف';
  }
  
  getStatusClass(status: LegalConsultation['status']): string {
    switch (status) {
      case 'جديدة': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'مكتملة': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'تحولت لقضية': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300';
      default: return '';
    }
  }

  clearReportFilters() {
    this.reportBranchFilter.set('all');
    this.reportFromDateFilter.set('');
    this.reportToDateFilter.set('');
  }
}