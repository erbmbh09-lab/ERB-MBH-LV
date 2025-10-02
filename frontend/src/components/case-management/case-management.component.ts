import { Component, ChangeDetectionStrategy, signal, computed, inject, effect } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { DataHubService } from '../../services/data-hub.service';
import { Case } from '../../services/case.service';
import { AddCaseFormComponent } from '../add-case-form/add-case-form.component';
import { SessionsRollComponent } from '../sessions-roll/sessions-roll.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-case-management',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, AddCaseFormComponent, SessionsRollComponent],
  templateUrl: './case-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseManagementComponent {
  dataHubService = inject(DataHubService);
  // FIX: Explicitly type `fb` as `FormBuilder` to resolve type inference errors on `.group()`, `.array()`, and `.control()`.
  private fb: FormBuilder = inject(FormBuilder);
  notificationService = inject(NotificationService);

  activeTab = signal<'list' | 'sessions' | 'convert' | 'linked'>('list');
  isFormVisible = signal(false);
  editingCase = signal<Case | null>(null);
  
  searchTerm = signal('');
  statusFilter = signal<'all' | 'مفتوحة' | 'قيد التنفيذ' | 'معلقة' | 'مغلقة'>('all');

  // FIX: Access cases through the correctly typed `dataHubService.cases` property.
  cases = this.dataHubService.cases.cases;
  
  filteredCases = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    
    return this.cases().filter(c => {
      const statusMatch = status === 'all' || c.status === status;
      const termMatch = term === '' ||
        c.id.toLowerCase().includes(term) ||
        c.clientName.toLowerCase().includes(term) ||
        c.opponentName.toLowerCase().includes(term) ||
        c.assignedLawyer.toLowerCase().includes(term);
        
      return statusMatch && termMatch;
    });
  });

  caseStats = computed(() => {
    return this.cases().reduce((acc, c) => {
      acc.total++;
      if (c.status === 'مفتوحة') acc.open++;
      else if (c.status === 'مغلقة') acc.closed++;
      else if (c.status === 'قيد التنفيذ') acc.inProgress++;
      else if (c.status === 'معلقة') acc.pending++;
      return acc;
    }, { total: 0, open: 0, closed: 0, inProgress: 0, pending: 0 });
  });

  conversionForm = this.fb.group({
    sourceCaseId: [null as string | null, Validators.required],
    newCaseType: ['مدني', Validators.required],
    newCaseNumber: ['', Validators.required],
    originalFileAction: ['archive', Validators.required]
  });

  linkingForm = this.fb.group({
    mainCaseId: [null as string | null, Validators.required],
    casesToLink: this.fb.array([this.fb.control(null, Validators.required)])
  });

  get casesToLink() {
    return this.linkingForm.get('casesToLink') as FormArray;
  }

  selectedLinkIds = computed(() => {
    const mainId = this.linkingForm.get('mainCaseId')?.value;
    const linkedIds = this.casesToLink.value || [];
    const allIds = [mainId, ...linkedIds].filter(id => id !== null);
    return new Set(allIds);
  });

  caseTypes = computed(() => {
    const types = this.cases().map(c => c.caseType);
    return [...new Set(types)];
  });

  constructor() {
    effect(() => {
      const caseIdToOpen = this.dataHubService.caseToOpen();
      if (caseIdToOpen) {
        const caseToEdit = this.cases().find(c => c.id === caseIdToOpen);
        if (caseToEdit) {
          this.activeTab.set('list');
          this.editCase(caseToEdit);
          this.dataHubService.caseToOpen.set(null); // Reset after opening
        }
      }
    }, { allowSignalWrites: true });
  }

  openAddForm() {
    this.editingCase.set(null);
    this.isFormVisible.set(true);
  }

  editCase(caseItem: Case) {
    this.editingCase.set(caseItem);
    this.isFormVisible.set(true);
  }

  closeForm() {
    this.isFormVisible.set(false);
    this.editingCase.set(null);
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'مفتوحة': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'قيد التنفيذ': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'معلقة': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'مغلقة': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return '';
    }
  }

  onConvertSubmit() {
    if (this.conversionForm.invalid) {
      this.notificationService.addNotification({
          type: 'alert',
          title: 'بيانات غير مكتملة',
          message: 'الرجاء ملء جميع الحقول المطلوبة لتنفيذ التحويل.'
      });
      return;
    }

    const formValue = this.conversionForm.value;
    console.log('Conversion details:', formValue);
    
    // Simulate action
    this.notificationService.addNotification({
        type: 'success',
        title: 'تم التحويل بنجاح',
        message: `تم تحويل الملف ${formValue.sourceCaseId} إلى ملف جديد برقم ${formValue.newCaseNumber}.`
    });

    this.conversionForm.reset({
        sourceCaseId: null,
        newCaseType: 'مدني',
        newCaseNumber: '',
        originalFileAction: 'archive'
    });
  }

  addCaseToLink() {
    this.casesToLink.push(this.fb.control(null, Validators.required));
  }

  removeCaseToLink(index: number) {
    this.casesToLink.removeAt(index);
  }

  onLinkSubmit() {
    if (this.linkingForm.invalid) {
      this.notificationService.addNotification({
        type: 'alert',
        title: 'بيانات غير مكتملة',
        message: 'الرجاء اختيار قضية رئيسية وقضية واحدة على الأقل لربطها.'
      });
      return;
    }

    const { mainCaseId, casesToLink } = this.linkingForm.getRawValue();
    // FIX: Access linkCases through the correctly typed `dataHubService.cases` property.
    this.dataHubService.cases.linkCases(mainCaseId!, casesToLink.filter((id: string | null) => id));
    
    this.notificationService.addNotification({
      type: 'success',
      title: 'تم الربط بنجاح',
      message: `تم ربط القضايا بالقضية الرئيسية ${mainCaseId}.`
    });

    this.linkingForm.reset();
    this.casesToLink.clear();
    this.casesToLink.push(this.fb.control(null, Validators.required));
  }
}
