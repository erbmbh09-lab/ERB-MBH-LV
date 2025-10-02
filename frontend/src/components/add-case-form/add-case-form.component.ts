import { Component, ChangeDetectionStrategy, output, signal, inject, input, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormsModule, AbstractControl } from '@angular/forms';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { Case, Session, Party, LitigationStage, JudicialAnnouncement, PetitionOrder, Execution, Memo } from '../../services/case.service';
import { Client } from '../../services/client.service';
import { DataHubService } from '../../services/data-hub.service';
import { NotificationService } from '../../services/notification.service';
import { GoogleCalendarService } from '../../services/google-calendar.service';
import { ClientFormComponent } from '../client-form/client-form.component';
import { TaskFormComponent } from '../task-form/task-form.component';

interface AccordionItem {
  id: string;
  title: string;
  icon: string;
}

@Component({
  selector: 'app-add-case-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FileUploadComponent, FormsModule, ClientFormComponent, TaskFormComponent],
  templateUrl: './add-case-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class AddCaseFormComponent {
  case = input<Case | null>(null);
  formClose = output<void>();

  isAddTaskModalVisible = signal(false);
  isAddPartyModalVisible = signal(false);
  
  // Wizard state
  currentStep = signal(1);
  activeCase = signal<Case | null>(null);

  // New signals for button states
  isImportant = signal(false);
  isConfidential = signal(false);
  isArchived = signal(false);
  isLinkingCounterClaim = signal(false);
  counterClaimId = signal('');

  // Signals for dynamic dropdowns
  caseClassifications = signal<string[]>(['قيد']);
  caseTypes = signal<string[]>(['مدني', 'عمالي', 'تجاري', 'عقاري', 'اداري', 'مصرفي', 'احوال', 'جزائي', 'ايجاري']);
  branches = signal<string[]>(['دبي']);
  policeStations = signal<string[]>(['مركز شرطة البرشاء']);
  prosecutions = signal<string[]>(['نيابة دبي الكلية']);
  courts = signal<string[]>(['محكمة دبي الابتدائية', 'محاكم دبي']);

  caseForm: FormGroup;
  isEditMode = computed(() => !!this.activeCase()?.id);

  steps = [
    { id: 1, title: 'المعلومات الأساسية', formGroupName: 'basicInfo' },
    { id: 2, title: 'الأطراف', formGroupName: 'parties' },
    { id: 3, title: 'المذكرات', formGroupName: 'memos' },
    { id: 4, title: 'المحاكم والجهات ذات الصلة', formGroupName: 'courtsPolice' },
    { id: 5, title: 'فريق العمل', formGroupName: 'fileTeam' },
    { id: 6, title: 'مراحل التقاضي', formGroupName: 'litigationStages' },
    { id: 7, title: 'الجلسات', formGroupName: 'hearings' },
    { id: 8, title: 'التنفيذات', formGroupName: 'executions' },
    { id: 9, title: 'المرفقات والمراجعة', formGroupName: 'attachments' }
  ];

  private fb: FormBuilder = inject(FormBuilder);
  private dataHubService = inject(DataHubService);
  private notificationService = inject(NotificationService);
  private googleCalendarService = inject(GoogleCalendarService);
  private datePipe = inject(DatePipe);

  allClients = this.dataHubService.clients.clients;
  allEmployees = this.dataHubService.hr.employees;
  
  lawyers = computed(() => this.allEmployees().filter(e => e.role.includes('محامي')));
  consultants = computed(() => this.allEmployees().filter(e => e.role.includes('مستشار')));
  researchers = computed(() => this.allEmployees().filter(e => e.role.includes('باحث')));
  secretaries = computed(() => this.allEmployees().filter(e => e.role.includes('سكرتير')));

  linkedCasesDetails = computed(() => {
    const currentCase = this.activeCase();
    if (!currentCase || !currentCase.linkedCaseIds) {
      return [];
    }
    const allCases = this.dataHubService.cases.cases();
    return currentCase.linkedCaseIds
      .map(id => allCases.find(c => c.id === id))
      .filter((c): c is Case => !!c);
  });

  constructor() {
    this.caseForm = this.fb.group({
      basicInfo: this.fb.group({
        classification: ['قيد'],
        caseType: ['مدني'],
        branch: ['دبي'],
        fileNumber: ['', Validators.required],
        caseNumber: ['', Validators.required],
        subject: ['', Validators.required],
        startDate: [new Date().toISOString().split('T')[0]],
        notes: [''],
      }),
      parties: this.fb.array([]),
      memos: this.fb.array([]),
      courtsPolice: this.fb.group({
        policeStation: [''],
        prosecution: [''],
        court: [''],
      }),
      fileTeam: this.fb.group({
        lawyer: [''],
        legalConsultant: [''],
        legalResearcher: [''],
        secretary: [''],
      }),
      litigationStages: this.fb.array([]),
      judicialAnnouncements: this.fb.array([]),
      petitionOrders: this.fb.array([]),
      hearings: this.fb.array([]),
      executions: this.fb.array([]),
    });

    effect(() => {
        this.activeCase.set(this.case());
        this.populateForm(this.case());
    });
  }
  
  private populateForm(caseData: Case | null): void {
    this.caseForm.reset();
    
    this.parties.clear();
    this.memos.clear();
    this.litigationStages.clear();
    this.judicialAnnouncements.clear();
    this.petitionOrders.clear();
    this.hearings.clear();
    this.executions.clear();

    // Reset signals
    this.isImportant.set(false);
    this.isConfidential.set(false);
    this.isArchived.set(false);
    this.isLinkingCounterClaim.set(false);
    this.counterClaimId.set('');
    this.currentStep.set(1);

    if (caseData) { // Edit mode
      this.caseForm.get('basicInfo')?.patchValue({
        classification: caseData.classification,
        caseType: caseData.caseType,
        branch: caseData.branch,
        fileNumber: caseData.id,
        caseNumber: caseData.internalCaseNumber,
        subject: caseData.subject,
        startDate: caseData.startDate,
        notes: caseData.notes,
      });

      if (caseData.parties && caseData.parties.length > 0) {
        caseData.parties.forEach(party => this.parties.push(this.createPartyGroup(party)));
      }
      
      caseData.memos?.forEach(memo => this.memos.push(this.createMemoGroup(memo)));
      if (caseData.courtsPolice) this.caseForm.get('courtsPolice')?.patchValue(caseData.courtsPolice);

      if (caseData.fileTeam) {
          const allEmployees = this.dataHubService.hr.employees();
          const getEmpName = (id?: number) => id ? allEmployees.find(e => e.id === id)?.name || '' : '';
          
          this.caseForm.get('fileTeam')?.patchValue({
              lawyer: getEmpName(caseData.fileTeam.lawyerId),
              legalConsultant: getEmpName(caseData.fileTeam.legalConsultantId),
              legalResearcher: getEmpName(caseData.fileTeam.legalResearcherId),
              secretary: getEmpName(caseData.fileTeam.secretaryId),
          });
      }
      
      caseData.litigationStages?.forEach(stage => this.litigationStages.push(this.createLitigationStageGroup(stage)));
      caseData.judicialAnnouncements?.forEach(ann => this.judicialAnnouncements.push(this.createJudicialAnnouncementGroup(ann)));
      caseData.petitionOrders?.forEach(order => this.petitionOrders.push(this.createPetitionOrderGroup(order)));
      caseData.executions?.forEach(exec => this.executions.push(this.createExecutionGroup(exec)));
      
      const caseSessions = this.dataHubService.cases.sessions().filter(s => s.caseId === caseData.id);
      caseSessions.forEach(session => this.hearings.push(this.createHearingGroup(session)));

      this.caseForm.get('basicInfo.fileNumber')?.disable();

      // Populate new signal states
      this.isImportant.set(caseData.isImportant || false);
      this.isConfidential.set(caseData.isConfidential || false);
      this.isArchived.set(caseData.status === 'مغلقة');
      if (caseData.counterClaimId) {
          this.isLinkingCounterClaim.set(true);
          this.counterClaimId.set(caseData.counterClaimId);
      }
    } else { // Add mode
      this.caseForm.get('basicInfo.fileNumber')?.enable();
      this.caseForm.patchValue({
        basicInfo: {
          classification: this.caseClassifications()[0], 
          caseType: this.caseTypes()[0], 
          branch: this.branches()[0],
          startDate: new Date().toISOString().split('T')[0],
        }
      });
      this.parties.push(this.createPartyGroup());
      this.litigationStages.push(this.createLitigationStageGroup());
      this.addMemo();
    }
  }

  get parties(): FormArray { return this.caseForm.get('parties') as FormArray; }
  get memos(): FormArray { return this.caseForm.get('memos') as FormArray; }
  get litigationStages(): FormArray { return this.caseForm.get('litigationStages') as FormArray; }
  get judicialAnnouncements(): FormArray { return this.caseForm.get('judicialAnnouncements') as FormArray; }
  get petitionOrders(): FormArray { return this.caseForm.get('petitionOrders') as FormArray; }
  get hearings(): FormArray { return this.caseForm.get('hearings') as FormArray; }
  get executions(): FormArray { return this.caseForm.get('executions') as FormArray; }

  createPartyGroup(party?: Party): FormGroup { return this.fb.group({ clientId: [party?.clientId || null, Validators.required], capacity: [party?.capacity || 'client', Validators.required] }); }
  createMemoGroup(memo?: Memo): FormGroup {
    const group = this.fb.group({
      title: [memo?.title || ''],
      content: [memo?.content || ''],
      status: [memo?.status || 'draft'],
      deadline: [memo?.deadline || ''],
      managerNotes: [{value: memo?.managerNotes || '', disabled: true}]
    });
    // Initially set the disabled state based on the status
    if (memo?.status !== 'draft') {
        group.get('managerNotes')?.enable({ emitEvent: false });
    }
    return group;
  }
  createLitigationStageGroup(stage?: LitigationStage): FormGroup { return this.fb.group({ degree: [stage?.degree || ''], caseNumber: [stage?.caseNumber || ''], year: [stage?.year || ''], clientCapacity: [stage?.clientCapacity || ''], opponentCapacity: [stage?.opponentCapacity || ''], referralDate: [stage?.referralDate || ''] }); }
  createJudicialAnnouncementGroup(ann?: JudicialAnnouncement): FormGroup { return this.fb.group({ title: [ann?.title || ''], issueDate: [ann?.issueDate || ''], legalPeriod: [ann?.legalPeriod || ''] }); }
  createPetitionOrderGroup(order?: PetitionOrder): FormGroup { return this.fb.group({ submissionDate: [order?.submissionDate || ''], orderType: [order?.orderType || ''], judgeDecision: [order?.judgeDecision || 'accepted'], legalPeriod: [order?.legalPeriod || ''] }); }
  createExecutionGroup(exec?: Execution): FormGroup { return this.fb.group({ date: [exec?.date || ''], type: [exec?.type || ''], status: [exec?.status || 'قيد التنفيذ'], amount: [exec?.amount || ''] }); }
  
  createHearingGroup(session?: Session): FormGroup {
    const formattedDate = session ? this.datePipe.transform(session.sessionDate, 'yyyy-MM-ddTHH:mm') : '';
    return this.fb.group({
      sessionId: [session?.id || null],
      dateTime: [formattedDate],
      decision: [session?.sessionDecision || ''],
      link: [''],
      notes: [session?.notes || ''],
      expertSession: [false],
      reservedForJudgment: [session?.reservedForJudgment || false],
      judgmentPostponed: [session?.judgmentPostponed || false],
    });
  }

  addParty() { this.parties.push(this.createPartyGroup()); }
  removeParty(index: number) { this.parties.removeAt(index); }
  addMemo() { this.memos.push(this.createMemoGroup()); }
  removeMemo(index: number) { this.memos.removeAt(index); }
  addLitigationStage() { this.litigationStages.push(this.createLitigationStageGroup()); }
  removeLitigationStage(index: number) { this.litigationStages.removeAt(index); }
  addJudicialAnnouncement() { this.judicialAnnouncements.push(this.createJudicialAnnouncementGroup()); }
  removeJudicialAnnouncement(index: number) { this.judicialAnnouncements.removeAt(index); }
  addPetitionOrder() { this.petitionOrders.push(this.createPetitionOrderGroup()); }
  removePetitionOrder(index: number) { this.petitionOrders.removeAt(index); }
  addHearing() { this.hearings.push(this.createHearingGroup()); }
  removeHearing(index: number) { this.hearings.removeAt(index); }
  addExecution() { this.executions.push(this.createExecutionGroup()); }
  removeExecution(index: number) { this.executions.removeAt(index); }

  openAddTaskModal() { this.isAddTaskModalVisible.set(true); }
  closeAddTaskModal() { this.isAddTaskModalVisible.set(false); }
  closeForm() { this.formClose.emit(); }
  navigateToCase(caseId: string) { this.dataHubService.caseToOpen.set(caseId); }
  toggleImportant() { this.isImportant.update(v => !v); }
  toggleConfidential() { this.isConfidential.update(v => !v); }
  toggleArchive() { this.isArchived.update(v => !v); }
  toggleLinkCounterClaim() { this.isLinkingCounterClaim.update(v => !v); }
  openAddPartyModal() { this.isAddPartyModalVisible.set(true); }
  closeAddPartyModal() { this.isAddPartyModalVisible.set(false); }

  onMemoStatusChange(memoGroup: AbstractControl, newStatus: string) {
    const managerNotesControl = memoGroup.get('managerNotes');
    const memoTitle = memoGroup.get('title')?.value || 'بدون عنوان';
    const caseId = this.caseForm.get('basicInfo.fileNumber')?.value;

    if (newStatus === 'draft') {
        managerNotesControl?.disable();
    } else {
        managerNotesControl?.enable();
    }

    switch (newStatus) {
        case 'pending_approval':
            this.notificationService.addNotification({
                type: 'alert',
                title: `مذكرة بانتظار الموافقة للقضية ${caseId}`,
                message: `المذكرة "${memoTitle}" جاهزة للمراجعة والموافقة.`
            });
            break;
        case 'approved':
            this.notificationService.addNotification({
                type: 'success',
                title: `تمت الموافقة على مذكرة للقضية ${caseId}`,
                message: `تمت الموافقة على المذكرة "${memoTitle}".`
            });
            break;
        case 'rejected':
            this.notificationService.addNotification({
                type: 'alert',
                title: `مذكرة مرفوضة للقضية ${caseId}`,
                message: `تم رفض المذكرة "${memoTitle}". يرجى مراجعة ملاحظات المدير.`
            });
            break;
    }
  }

  onReservedChange(hearingGroup: AbstractControl, isChecked: boolean) {
    const judgmentPostponedControl = hearingGroup.get('judgmentPostponed');
    if (!isChecked && judgmentPostponedControl?.value) {
        judgmentPostponedControl.setValue(false, { emitEvent: false });
    }
  }

  // Stepper navigation
  goToStep(stepId: number) {
    if (stepId >= 1 && stepId <= this.steps.length) {
      this.currentStep.set(stepId);
    }
  }

  nextStep() {
    if (this.currentStep() < this.steps.length) {
      this.currentStep.update(s => s + 1);
    }
  }

  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  async onPartyFormSubmit(clientData: Client) {
    try {
      await this.dataHubService.clients.addClient(clientData);
      this.notificationService.addNotification({ type: 'success', title: 'تمت الإضافة بنجاح', message: `تمت إضافة "${clientData.nameAr}" إلى قائمة العملاء.` });
      this.closeAddPartyModal();
    } catch (error) {
      this.notificationService.addNotification({ type: 'alert', title: 'خطأ في الإدخال', message: `الكود التعريفي "${clientData.id}" مستخدم بالفعل.` });
    }
  }
  
  addOption(optionType: 'classification' | 'type' | 'branch' | 'policeStation' | 'prosecution' | 'court') {
    const newOption = prompt('أدخل الخيار الجديد:');
    if (newOption && newOption.trim() !== '') {
      switch (optionType) {
        case 'classification':
          this.caseClassifications.update(options => [...options, newOption]);
          this.caseForm.get('basicInfo.classification')?.setValue(newOption);
          break;
        case 'type':
          this.caseTypes.update(options => [...options, newOption]);
          this.caseForm.get('basicInfo.caseType')?.setValue(newOption);
          break;
        case 'branch':
          this.branches.update(options => [...options, newOption]);
          this.caseForm.get('basicInfo.branch')?.setValue(newOption);
          break;
        case 'policeStation':
          this.policeStations.update(options => [...options, newOption]);
          this.caseForm.get('courtsPolice.policeStation')?.setValue(newOption);
          break;
        case 'prosecution':
          this.prosecutions.update(options => [...options, newOption]);
          this.caseForm.get('courtsPolice.prosecution')?.setValue(newOption);
          break;
        case 'court':
          this.courts.update(options => [...options, newOption]);
          this.caseForm.get('courtsPolice.court')?.setValue(newOption);
          break;
      }
    }
  }

  private async syncHearingsToGoogleCalendar(caseData: Case) {
    if (!this.googleCalendarService.isSignedIn()) return;
    const hearingsData = this.hearings.value as { sessionId: number | null, dateTime: string, decision: string, notes: string }[];
    for (const hearing of hearingsData) {
      if (!hearing.dateTime) continue;
      const startDateTime = new Date(hearing.dateTime);
      if (isNaN(startDateTime.getTime())) continue; 
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
      const eventDetails = {
        summary: `جلسة: ${caseData.id} - ${caseData.clientName}`,
        description: `<b>القضية:</b> ${caseData.id}<br><b>الموكل:</b> ${caseData.clientName}<br><b>الخصم:</b> ${caseData.opponentName}<br><b>المحكمة:</b> ${caseData.court}<br><b>ملاحظات:</b> ${hearing.notes || 'لا يوجد'}`,
        start: { dateTime: startDateTime.toISOString(), timeZone: 'Asia/Dubai' },
        end: { dateTime: endDateTime.toISOString(), timeZone: 'Asia/Dubai' },
        extendedProperties: { private: { appSessionId: `session-${hearing.sessionId}` } }
      };
      try {
        if (hearing.sessionId) { await this.googleCalendarService.createOrUpdateEvent(eventDetails); }
      } catch (error) {
        this.notificationService.addNotification({ type: 'alert', title: 'فشل مزامنة التقويم', message: `لم يتمكن من مزامنة جلسة القضية ${caseData.id} مع تقويم جوجل.` });
      }
    }
  }

  private buildCaseData(): Case {
    const formValue = this.caseForm.getRawValue();
    const clientParty = formValue.parties.find((p: any) => p.capacity === 'client');
    const opponentParty = formValue.parties.find((p: any) => p.capacity === 'opponent');
    const clientName = clientParty ? this.allClients().find(c => c.id === clientParty.clientId)?.nameAr || 'غير محدد' : 'غير محدد';
    const opponentName = opponentParty ? this.allClients().find(c => c.id === opponentParty.clientId)?.nameAr || 'غير محدد' : 'غير محدد';
    const getEmpId = (name?: string) => name ? this.allEmployees().find(e => e.name === name)?.id : undefined;
    
    let newStatus: Case['status'] = this.activeCase()?.status || 'مفتوحة';
    if (this.isArchived() && newStatus !== 'مغلقة') newStatus = 'مغلقة';
    if (!this.isArchived() && newStatus === 'مغلقة') newStatus = 'مفتوحة';

    return {
      ...(this.activeCase() || {} as Case),
      id: formValue.basicInfo.fileNumber,
      internalCaseNumber: formValue.basicInfo.caseNumber,
      classification: formValue.basicInfo.classification,
      caseType: formValue.basicInfo.caseType,
      branch: formValue.basicInfo.branch,
      fees: 0,
      subject: formValue.basicInfo.subject,
      startDate: formValue.basicInfo.startDate,
      notes: formValue.basicInfo.notes,
      parties: formValue.parties,
      clientName,
      opponentName,
      memos: formValue.memos,
      courtsPolice: formValue.courtsPolice,
      fileTeam: {
        lawyerId: getEmpId(formValue.fileTeam.lawyer),
        legalConsultantId: getEmpId(formValue.fileTeam.legalConsultant),
        legalResearcherId: getEmpId(formValue.fileTeam.legalResearcher),
        secretaryId: getEmpId(formValue.fileTeam.secretary),
      },
      litigationStages: formValue.litigationStages,
      judicialAnnouncements: formValue.judicialAnnouncements,
      petitionOrders: formValue.petitionOrders,
      executions: formValue.executions,
      assignedLawyer: formValue.fileTeam.lawyer || 'غير محدد',
      court: formValue.courtsPolice.court || 'غير محدد',
      lastUpdate: new Date().toISOString().split('T')[0],
      litigationStage: formValue.litigationStages[formValue.litigationStages.length - 1]?.degree || 'ابتدائي',
      status: newStatus,
      isImportant: this.isImportant(),
      isConfidential: this.isConfidential(),
      counterClaimId: this.isLinkingCounterClaim() ? this.counterClaimId() : undefined,
    };
  }

  async saveAndClose() {
    if (this.caseForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى التحقق من الحقول الإلزامية في جميع الخطوات.' });
      this.caseForm.markAllAsTouched();
      return;
    }
    
    try {
      const caseData = this.buildCaseData();
      const hearingsData = this.caseForm.getRawValue().hearings;
      
      if (this.isEditMode()) {
        await this.dataHubService.cases.updateCase(caseData);
        
        const existingSessionIds = this.dataHubService.cases.sessions()
          .filter(s => s.caseId === caseData.id)
          .map(s => s.id);

        for (const hearing of hearingsData) {
          const sessionDate = new Date(hearing.dateTime);
          if (isNaN(sessionDate.getTime())) continue;

          const sessionPayload: Omit<Session, 'id'> & { id?: number } = {
            id: hearing.sessionId || undefined,
            caseId: caseData.id,
            sessionDate: sessionDate,
            sessionDecision: hearing.decision,
            notes: hearing.notes,
            reservedForJudgment: hearing.reservedForJudgment,
            judgmentPostponed: hearing.reservedForJudgment && hearing.judgmentPostponed,
            previousDecision: '', // This needs more context to be accurate
            case: { number: caseData.internalCaseNumber.split('/')[1], year: caseData.internalCaseNumber.split('/')[0].split('-')[1], type: caseData.caseType, court: caseData.court, date: caseData.startDate },
            client: { name: caseData.clientName, capacity: '' },
            opponent: { name: caseData.opponentName, capacity: '' },
          };

          if (hearing.sessionId && existingSessionIds.includes(hearing.sessionId)) {
            await this.dataHubService.cases.updateSession(sessionPayload as Session);
          } else {
            delete sessionPayload.id;
            await this.dataHubService.cases.addSession(sessionPayload as Omit<Session, 'id'>);
          }
        }

        this.notificationService.addNotification({ type: 'success', title: 'تم التحديث', message: `تم تحديث بيانات القضية ${caseData.id} بنجاح.` });
      } else {
        await this.dataHubService.cases.addCase(caseData);
        for (const hearing of hearingsData) {
            if (!hearing.dateTime) continue;
            const sessionDate = new Date(hearing.dateTime);
            if (isNaN(sessionDate.getTime())) return;
          
            const sessionPayload: Omit<Session, 'id'> = {
              caseId: caseData.id,
              sessionDate: sessionDate,
              sessionDecision: hearing.decision,
              notes: hearing.notes,
              reservedForJudgment: hearing.reservedForJudgment,
              judgmentPostponed: hearing.reservedForJudgment && hearing.judgmentPostponed,
              previousDecision: 'فتح ملف',
              case: { number: caseData.internalCaseNumber.split('/')[1], year: caseData.internalCaseNumber.split('/')[0].split('-')[1], type: caseData.caseType, court: caseData.court, date: caseData.startDate },
              client: { name: caseData.clientName, capacity: '' },
              opponent: { name: caseData.opponentName, capacity: '' },
            };
            await this.dataHubService.cases.addSession(sessionPayload);
        }
        this.notificationService.addNotification({ type: 'success', title: 'تم الحفظ', message: `تم إنشاء القضية ${caseData.id} بنجاح.` });
      }
      
      await this.syncHearingsToGoogleCalendar(caseData);
      this.closeForm();
    } catch(error) {
      console.error('Error saving case:', error);
      this.notificationService.addNotification({ type: 'alert', title: 'فشل الحفظ', message: 'حدث خطأ أثناء الاتصال بالخادم. قد يكون رقم الملف مستخدمًا بالفعل.' });
    }
  }
}