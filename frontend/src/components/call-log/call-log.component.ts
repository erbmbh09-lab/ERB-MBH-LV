import { Component, ChangeDetectionStrategy, signal, computed, inject, Renderer2 } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { DataHubService } from '../../services/data-hub.service';
import { CallLog } from '../../services/call-log.service';
import { Employee } from '../../services/hr.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-call-log',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './call-log.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class CallLogComponent {
  dataHubService = inject(DataHubService);
  notificationService = inject(NotificationService);
  // FIX: Explicitly type `fb` as `FormBuilder` to resolve type inference errors on `.group()`.
  private fb: FormBuilder = inject(FormBuilder);
  private datePipe = inject(DatePipe);
  private renderer = inject(Renderer2);

  isModalVisible = signal(false);
  editingCall = signal<CallLog | null>(null);
  searchTerm = signal('');
  typeFilter = signal<'all' | 'واردة' | 'صادرة'>('all');
  statusFilter = signal<'all' | 'مكتملة' | 'تتطلب متابعة'>('all');

  // Report Signals
  isReportModalVisible = signal(false);
  reportBranchFilter = signal<string>('all');
  reportFromDateFilter = signal<string>('');
  reportToDateFilter = signal<string>('');
  isReportExpanded = signal(false);

  callLogForm = this.fb.group({
    callType: ['واردة' as CallLog['callType'], Validators.required],
    callerName: ['', Validators.required],
    callerNumber: ['', Validators.required],
    callDate: ['', Validators.required],
    callTime: ['', Validators.required],
    duration: [0, [Validators.required, Validators.min(1)]],
    subject: ['', Validators.required],
    details: [''],
    employeeId: [null as number | null, Validators.required],
    status: ['مكتملة' as CallLog['status'], Validators.required],
    relatedCaseId: ['']
  });
  
  allLogs = this.dataHubService.callLogs.callLogs;
  // FIX: Access employees through the correctly typed `dataHubService.hr` property.
  allEmployees = this.dataHubService.hr.employees;
  
  filteredLogs = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const type = this.typeFilter();
    const status = this.statusFilter();
    
    return this.allLogs().filter(log => {
      const typeMatch = type === 'all' || log.callType === type;
      const statusMatch = status === 'all' || log.status === status;
      
      const termMatch = !term ||
        log.callerName.toLowerCase().includes(term) ||
        log.callerNumber.toLowerCase().includes(term) ||
        log.subject.toLowerCase().includes(term);
        
      return typeMatch && statusMatch && termMatch;
    });
  });

  stats = computed(() => {
    return this.allLogs().reduce((acc, log) => {
      acc.total++;
      if (log.callType === 'واردة') acc.incoming++;
      if (log.callType === 'صادرة') acc.outgoing++;
      if (log.status === 'تتطلب متابعة') acc.followUp++;
      return acc;
    }, { total: 0, incoming: 0, outgoing: 0, followUp: 0 });
  });
  
  availableBranches = computed(() => {
    const branches = this.allEmployees().map(e => e.branch);
    return [...new Set(branches)];
  });

  filteredReportLogs = computed(() => {
    const branchFilter = this.reportBranchFilter();
    const fromDate = this.reportFromDateFilter() ? new Date(this.reportFromDateFilter()) : null;
    const toDate = this.reportToDateFilter() ? new Date(this.reportToDateFilter()) : null;

    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    if (toDate) toDate.setHours(23, 59, 59, 999);

    const logsWithBranch = this.allLogs().map(log => {
        const employee = this.allEmployees().find(e => e.id === log.employeeId);
        return { ...log, branch: employee?.branch || 'غير محدد' };
    });

    return logsWithBranch.filter(log => {
        const logDate = new Date(log.callDate);
        const branchMatch = branchFilter === 'all' || log.branch === branchFilter;
        const dateMatch = (!fromDate || logDate >= fromDate) && (!toDate || logDate <= toDate);
        return branchMatch && dateMatch;
    });
  });
  
  reportStats = computed(() => {
    return this.filteredReportLogs().reduce((acc, log) => {
        acc.totalDuration += log.duration;
        if(log.callType === 'واردة') acc.incoming++;
        else acc.outgoing++;
        return acc;
    }, { totalDuration: 0, incoming: 0, outgoing: 0 });
  });

  openModal(log: CallLog | null = null) {
    this.callLogForm.reset({
      callType: 'واردة',
      status: 'مكتملة',
      callDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd'),
      callTime: this.datePipe.transform(new Date(), 'HH:mm'),
      duration: 5
    });
    this.editingCall.set(log);
    if (log) {
      this.callLogForm.patchValue(log);
    }
    this.isModalVisible.set(true);
  }

  closeModal() {
    this.isModalVisible.set(false);
    this.editingCall.set(null);
  }
  
  onSubmit() {
    if (this.callLogForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء جميع الحقول الإلزامية.' });
      return;
    }
    
    const formValue = this.callLogForm.getRawValue() as Omit<CallLog, 'id'>;
    const editing = this.editingCall();

    if (editing) {
      const updatedData: CallLog = { ...editing, ...formValue };
      this.dataHubService.callLogs.updateCallLog(updatedData);
      this.notificationService.addNotification({ type: 'success', title: 'تم التحديث', message: `تم تحديث سجل المكالمة.` });
    } else {
      this.dataHubService.callLogs.addCallLog(formValue);
      this.notificationService.addNotification({ type: 'success', title: 'تمت الإضافة', message: `تم تسجيل مكالمة جديدة.` });
    }
    
    this.closeModal();
  }
  
  deleteLog(id: number) {
      if (confirm('هل أنت متأكد من حذف سجل هذه المكالمة؟')) {
          this.dataHubService.callLogs.deleteCallLog(id);
          this.notificationService.addNotification({ type: 'success', title: 'تم الحذف', message: 'تم حذف سجل المكالمة بنجاح.' });
      }
  }

  getEmployeeName(id: number): string {
    return this.allEmployees().find(e => e.id === id)?.name || 'غير معروف';
  }
  
  getStatusClass(status: CallLog['status']): string {
    switch (status) {
      case 'مكتملة': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'تتطلب متابعة': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      default: return '';
    }
  }

  // Report Modal Methods
  openReportModal() {
    this.isReportModalVisible.set(true);
    this.renderer.addClass(document.body, 'print-modal-active');
  }

  closeReportModal() {
    this.isReportModalVisible.set(false);
    this.renderer.removeClass(document.body, 'print-modal-active');
  }
  
  clearReportFilters() {
    this.reportBranchFilter.set('all');
    this.reportFromDateFilter.set('');
    this.reportToDateFilter.set('');
  }

  printReport() {
    window.print();
  }

  exportReport() {
    console.log("Exporting report...", this.filteredReportLogs());
    this.notificationService.addNotification({
        type: 'info',
        title: 'قيد التنفيذ',
        message: 'سيتم تنفيذ وظيفة تصدير CSV قريبًا.'
    });
  }
}