import { Component, ChangeDetectionStrategy, input, output, effect, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { DataHubService } from '../../services/data-hub.service';
import { Employee, AttendanceRecord, Deduction, Leave, OtherLeave, Appraisal, Warning, Training, Request, LeaveRequestType, CertificateRequestType, RequestType, ExternalMission } from '../../services/hr.service';
import { NotificationService } from '../../services/notification.service';
import { debounceTime, map, startWith, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FileUploadComponent],
  templateUrl: './employee-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class EmployeeFormComponent implements OnDestroy {
  employee = input<Employee | null>();
  formClose = output<void>();

  private fb = inject(FormBuilder);
  private dataHubService = inject(DataHubService);
  private notificationService = inject(NotificationService);
  private datePipe = inject(DatePipe);
  private destroy$ = new Subject<void>();

  activeTab = signal<'data' | 'documents' | 'time' | 'performance' | 'requests'>('data');
  employeeForm!: FormGroup;
  newRequestForm!: FormGroup;
  totalSalary = signal(0);
  isSubmitting = signal(false);
  
  // Lists for dropdown options
  leaveRequestTypes: LeaveRequestType[] = ['إجازة سنوية', 'إجازة مرضية', 'إجازة دراسية', 'إجازة أمومة', 'إجازة أبوية', 'إجازة أخرى'];
  certificateRequestTypes: CertificateRequestType[] = ['شهادة راتب', 'شهادة خبرة', 'شهادة لا مانع', 'بدل إجازة سنوية'];
  genderOptions = ['ذكر', 'أنثى'];
  maritalStatusOptions = ['أعزب', 'متزوج', 'مطلق', 'أرمل'];
  branchOptions = ['دبي', 'الشارقة', 'عجمان', 'أبوظبي', 'الفجيرة', 'رأس الخيمة', 'أم القيوين'];
  contractTypeOptions = ['كامل', 'جزئي', 'مؤقت', 'تدريب'];
  salaryPaymentMethodOptions = [{ value: 'wps', label: 'WPS' }, { value: 'cash', label: 'نقدي' }, { value: 'cheque', label: 'شيك' }];

  get officialHolidays() {
    try {
      return this.dataHubService.systemSettings.officialHolidays();
    } catch (error) {
      console.error('Error fetching official holidays:', error);
      return [];
    }
  }

  constructor() {
    this.buildForms();
    this.setupFormSubscriptions();
    this.setupEmployeeEffect();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForms(): void {
    this.buildEmployeeForm();
    this.buildNewRequestForm();
  }

  private buildEmployeeForm(): void {
    try {
      const currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '';
      
      this.employeeForm = this.fb.group({
        // البيانات الأساسية
        name: ['', [Validators.required, Validators.minLength(2)]],
        id: [null, [Validators.required, Validators.pattern('^[0-9]+$')]],
        nationality: ['الإمارات العربية المتحدة'],
        dateOfBirth: [''],
        gender: ['ذكر', Validators.required],
        maritalStatus: ['أعزب'],
        mobilePhone: ['', [Validators.required, Validators.pattern('^[0-9]{8,15}$')]],
        address: [''],
        
        // بيانات العمل
        joinDate: [currentDate, Validators.required],
        role: ['', Validators.required],
        department: [''],
        branch: ['دبي', Validators.required],
        contractType: ['كامل', Validators.required],
        contractEndDate: [''],
        contractEndReminderDays: [30, [Validators.min(1), Validators.max(365)]],
        directManagerId: [null],
        residencyStatus: [''],
        
        // التراخيص والوثائق
        proCardExpiry: [''],
        proCardReminderDays: [30, [Validators.min(1), Validators.max(365)]],
        lawyerLicenseDubaiExpiry: [''],
        lawyerLicenseDubaiReminderDays: [30, [Validators.min(1), Validators.max(365)]],
        lawyerLicenseSharjahExpiry: [''],
        lawyerLicenseSharjahReminderDays: [30, [Validators.min(1), Validators.max(365)]],
        lawyerLicenseAjmanExpiry: [''],
        lawyerLicenseAjmanReminderDays: [30, [Validators.min(1), Validators.max(365)]],
        lawyerLicenseAbuDhabiExpiry: [''],
        lawyerLicenseAbuDhabiReminderDays: [30, [Validators.min(1), Validators.max(365)]],
        
        // الصحة
        hasHealthIssues: [false],
        healthIssuesDetails: [''],
        
        // جهات الاتصال للطوارئ
        emergencyContacts: this.fb.array([this.createEmergencyContactGroup(), this.createEmergencyContactGroup()]),
        
        // الوثائق الشخصية
        passportNo: [''],
        passportExpiry: [''],
        passportExpiryReminderDays: [30, [Validators.min(1), Validators.max(365)]],
        emiratesIdNo: [''],
        emiratesIdExpiry: [''],
        emiratesIdExpiryReminderDays: [30, [Validators.min(1), Validators.max(365)]],
        workPermitNo: [''],
        workPermitExpiry: [''],
        workPermitExpiryReminderDays: [30, [Validators.min(1), Validators.max(365)]],
        healthInsuranceExpiry: [''],
        healthInsuranceExpiryReminderDays: [30, [Validators.min(1), Validators.max(365)]],
        
        // البيانات البنكية
        bankName: [''],
        iban: [''],
        accountNo: [''],
        salaryPaymentMethod: ['wps', Validators.required],
        
        // تفاصيل الراتب
        salaryDetails: this.fb.group({
          basic: [0, [Validators.required, Validators.min(0)]],
          housing: [0, [Validators.min(0)]],
          transport: [0, [Validators.min(0)]],
          other: [0, [Validators.min(0)]]
        }),
        
        // ساعات العمل
        workingHours: this.fb.group({ startTime: ['08:00', Validators.required], endTime: ['17:00', Validators.required] }),
        
        // المصفوفات
        externalMissions: this.fb.array([]),
        attendanceRecords: this.fb.array([]),
        deductions: this.fb.array([]),
        annualLeaves: this.fb.array([]),
        sickLeaves: this.fb.array([]),
        otherLeaves: this.fb.array([]),
        appraisals: this.fb.array([]),
        warnings: this.fb.array([]),
        trainings: this.fb.array([]),
        requests: this.fb.array([])
      });
    } catch (error) {
      console.error('Error building employee form:', error);
      this.notificationService.addNotification({ type: 'alert', title: 'خطأ', message: 'حدث خطأ في تحضير النموذج.' });
    }
  }

  private buildNewRequestForm(): void {
    this.newRequestForm = this.fb.group({
      requestType: [this.leaveRequestTypes[0], Validators.required],
      from: [''],
      to: [''],
      details: ['', [Validators.maxLength(500)]]
    });
  }

  private createEmergencyContactGroup() {
    return this.fb.group({ name: [''], relationship: [''], phone: ['', Validators.pattern('^[0-9]{8,15}$')] });
  }

  private setupFormSubscriptions(): void {
    this.newRequestForm.get('requestType')?.valueChanges
      .pipe(startWith(this.newRequestForm.get('requestType')?.value), takeUntil(this.destroy$))
      .subscribe(type => this.updateRequestFormValidators(type as RequestType));

    const salaryDetails = this.employeeForm.get('salaryDetails');
    if (salaryDetails) {
      salaryDetails.valueChanges
        .pipe(startWith(salaryDetails.value), debounceTime(300), takeUntil(this.destroy$))
        .subscribe(val => {
          const total = this.calculateTotalSalary(val);
          this.totalSalary.set(total);
        });
    }
  }

  private updateRequestFormValidators(type: RequestType): void {
    const fromControl = this.newRequestForm.get('from');
    const toControl = this.newRequestForm.get('to');
    if (!fromControl || !toControl) return;

    if (this.isLeaveRequestType(type)) {
      fromControl.setValidators([Validators.required]);
      toControl.setValidators([Validators.required]);
    } else {
      fromControl.clearValidators();
      toControl.clearValidators();
      fromControl.setValue('');
      toControl.setValue('');
    }
    fromControl.updateValueAndValidity();
    toControl.updateValueAndValidity();
  }

  private setupEmployeeEffect(): void {
    effect(() => {
      const emp = this.employee();
      this.resetForm();
      if (emp) {
        this.populateFormWithEmployee(emp);
      } else {
        this.setDefaultValues();
      }
    });
  }

  private resetForm(): void {
    this.employeeForm.reset();
    this.clearAllFormArrays();
  }

  private populateFormWithEmployee(emp: Employee): void {
    this.employeeForm.patchValue(emp);
    this.setFormArray('externalMissions', emp.externalMissions, this.createExternalMissionGroup);
    this.setFormArray('attendanceRecords', emp.attendanceRecords, this.createAttendanceRecordGroup);
    this.setFormArray('deductions', emp.deductions, this.createDeductionGroup);
    this.setFormArray('annualLeaves', emp.annualLeaves, this.createLeaveGroup);
    this.setFormArray('sickLeaves', emp.sickLeaves, this.createLeaveGroup);
    this.setFormArray('otherLeaves', emp.otherLeaves, this.createOtherLeaveGroup);
    this.setFormArray('appraisals', emp.appraisals, this.createAppraisalGroup);
    this.setFormArray('warnings', emp.warnings, this.createWarningGroup);
    this.setFormArray('trainings', emp.trainings, this.createTrainingGroup);
    this.setFormArray('requests', emp.requests, this.createRequestGroup);
    if (emp.salaryDetails) {
      this.totalSalary.set(this.calculateTotalSalary(emp.salaryDetails));
    }
  }

  private setDefaultValues(): void {
    this.employeeForm.patchValue({
      joinDate: this.datePipe.transform(new Date(), 'yyyy-MM-dd'),
      gender: 'ذكر', maritalStatus: 'أعزب', branch: 'دبي', contractType: 'كامل', salaryPaymentMethod: 'wps'
    });
    this.totalSalary.set(0);
  }

  private calculateTotalSalary(salaryDetails: Partial<{ basic: number | null; housing: number | null; transport: number | null; other: number | null; }> | null): number {
    if (!salaryDetails) return 0;
    const { basic = 0, housing = 0, transport = 0, other = 0 } = salaryDetails;
    return (basic || 0) + (housing || 0) + (transport || 0) + (other || 0);
  }

  private setFormArray<T>(arrayName: string, data: T[] | undefined, createGroup: (item?: T) => FormGroup) {
    const formArray = this.employeeForm.get(arrayName) as FormArray;
    if (!formArray) return;
    formArray.clear();
    data?.forEach(item => { if (item) { formArray.push(createGroup.call(this, item)); } });
  }
  
  private clearAllFormArrays() {
    Object.keys(this.employeeForm.controls).forEach(key => {
      const control = this.employeeForm.get(key);
      if (control instanceof FormArray) { control.clear(); }
    });
  }

  get emergencyContacts() { return this.employeeForm.get('emergencyContacts') as FormArray; }
  get externalMissions() { return this.employeeForm.get('externalMissions') as FormArray; }
  get attendanceRecords() { return this.employeeForm.get('attendanceRecords') as FormArray; }
  get deductions() { return this.employeeForm.get('deductions') as FormArray; }
  get annualLeaves() { return this.employeeForm.get('annualLeaves') as FormArray; }
  get sickLeaves() { return this.employeeForm.get('sickLeaves') as FormArray; }
  get otherLeaves() { return this.employeeForm.get('otherLeaves') as FormArray; }
  get appraisals() { return this.employeeForm.get('appraisals') as FormArray; }
  get warnings() { return this.employeeForm.get('warnings') as FormArray; }
  get trainings() { return this.employeeForm.get('trainings') as FormArray; }
  get requests() { return this.employeeForm.get('requests') as FormArray; }

  private createExternalMissionGroup = (item: ExternalMission = {} as ExternalMission) => this.fb.group({ date: [item.date, Validators.required], fromTime: [item.fromTime, Validators.required], toTime: [item.toTime, Validators.required], destination: [item.destination, Validators.required], reason: [item.reason, Validators.required] });
  private createAttendanceRecordGroup = (item: AttendanceRecord = {} as AttendanceRecord) => this.fb.group({ date: [item.date, Validators.required], signIn: [item.signIn], signOut: [item.signOut], lateMinutes: [item.lateMinutes, Validators.min(0)], earlyLeaveMinutes: [item.earlyLeaveMinutes, Validators.min(0)] });
  private createDeductionGroup = (item: Deduction = {} as Deduction) => this.fb.group({ date: [item.date, Validators.required], totalSalary: [item.totalSalary, [Validators.required, Validators.min(0)]], amount: [item.amount, [Validators.required, Validators.min(0)]], reason: [item.reason, Validators.required] });
  private createLeaveGroup = (item: Leave = {} as Leave) => this.fb.group({ date: [item.date, Validators.required], type: [item.type, Validators.required], from: [item.from, Validators.required], to: [item.to, Validators.required], days: [item.days, [Validators.required, Validators.min(0)]], remaining: [item.remaining, Validators.min(0)] });
  private createOtherLeaveGroup = (item: OtherLeave = {} as OtherLeave) => this.fb.group({ date: [item.date, Validators.required], leaveType: [item.leaveType, Validators.required], type: [item.type, Validators.required], from: [item.from, Validators.required], to: [item.to, Validators.required], days: [item.days, [Validators.required, Validators.min(0)]], remaining: [item.remaining, Validators.min(0)] });
  private createAppraisalGroup = (item: Appraisal = {} as Appraisal) => this.fb.group({ date: [item.date, Validators.required], type: [item.type, Validators.required] });
  private createWarningGroup = (item: Warning = {} as Warning) => this.fb.group({ date: [item.date, Validators.required], type: [item.type, Validators.required], reason: [item.reason, Validators.required] });
  private createTrainingGroup = (item: Training = {} as Training) => this.fb.group({ date: [item.date, Validators.required], type: [item.type, Validators.required] });
  private createRequestGroup = (item: Request = {} as Request) => this.fb.group({ submissionDate: [item.submissionDate, Validators.required], requestType: [item.requestType, Validators.required], from: [item.from], to: [item.to], details: [item.details], directorApproval: [item.directorApproval], hrApproval: [item.hrApproval] });

  addExternalMission = () => this.externalMissions.push(this.createExternalMissionGroup());
  addAttendanceRecord = () => this.attendanceRecords.push(this.createAttendanceRecordGroup());
  addDeduction = () => this.deductions.push(this.createDeductionGroup());
  addAnnualLeave = () => this.annualLeaves.push(this.createLeaveGroup());
  addSickLeave = () => this.sickLeaves.push(this.createLeaveGroup());
  addOtherLeave = () => this.otherLeaves.push(this.createOtherLeaveGroup());
  addAppraisal = () => this.appraisals.push(this.createAppraisalGroup());
  addWarning = () => this.warnings.push(this.createWarningGroup());
  addTraining = () => this.trainings.push(this.createTrainingGroup());
  
  removeExternalMission = (i: number) => this.removeFromArray(this.externalMissions, i);
  removeAttendanceRecord = (i: number) => this.removeFromArray(this.attendanceRecords, i);
  removeDeduction = (i: number) => this.removeFromArray(this.deductions, i);
  removeAnnualLeave = (i: number) => this.removeFromArray(this.annualLeaves, i);
  removeSickLeave = (i: number) => this.removeFromArray(this.sickLeaves, i);
  removeOtherLeave = (i: number) => this.removeFromArray(this.otherLeaves, i);
  removeAppraisal = (i: number) => this.removeFromArray(this.appraisals, i);
  removeWarning = (i: number) => this.removeFromArray(this.warnings, i);
  removeTraining = (i: number) => this.removeFromArray(this.trainings, i);

  private removeFromArray(formArray: FormArray, index: number) {
    if (index >= 0 && index < formArray.length) {
      formArray.removeAt(index);
    }
  }

  isLeaveRequestType(type: RequestType): boolean {
    return this.leaveRequestTypes.includes(type as LeaveRequestType);
  }

  addRequest() {
    if (this.newRequestForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'الرجاء ملء جميع الحقول المطلوبة (*).' });
      this.newRequestForm.markAllAsTouched();
      return;
    }
    const formValue = this.newRequestForm.value;
    const request: Request = {
      submissionDate: new Date().toISOString().split('T')[0],
      requestType: formValue.requestType,
      from: this.isLeaveRequestType(formValue.requestType) ? formValue.from : undefined,
      to: this.isLeaveRequestType(formValue.requestType) ? formValue.to : undefined,
      details: formValue.details || '',
      directorApproval: 'قيد الانتظار',
      hrApproval: 'قيد الانتظار'
    };
    this.requests.insert(0, this.createRequestGroup(request));
    this.newRequestForm.reset({ requestType: this.leaveRequestTypes[0] });
    this.notificationService.addNotification({ type: 'success', title: 'تم تقديم الطلب', message: `تم تقديم طلب "${request.requestType}" بنجاح.` });
  }

  exportRequests() {
    this.notificationService.addNotification({ type: 'info', title: 'قيد التنفيذ', message: 'سيتم تنفيذ وظيفة التصدير قريبًا.' });
  }

  getStatusClass(status: 'قيد الانتظار' | 'موافق عليه' | 'مرفوض'): string {
    const statusClasses = { 'قيد الانتظار': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', 'موافق عليه': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', 'مرفوض': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  async onSubmit() {
    if (this.isSubmitting()) return;
    if (this.employeeForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'الرجاء ملء جميع الحقول الإلزامية (*) والتأكد من صحة البيانات.' });
      this.employeeForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);

    const formValue = this.employeeForm.getRawValue();
    const currentEmployee = this.employee();
    const employeeData = { ...(currentEmployee || {}), ...formValue } as Employee;
    
    try {
      if (currentEmployee) {
        await this.dataHubService.hr.updateEmployee(employeeData);
        this.notificationService.addNotification({ type: 'success', title: 'تم التحديث', message: `تم تحديث بيانات الموظف "${formValue.name}" بنجاح.` });
      } else {
        await this.dataHubService.hr.addEmployee(employeeData);
        this.notificationService.addNotification({ type: 'success', title: 'تم الحفظ', message: `تم حفظ بيانات الموظف "${formValue.name}" بنجاح.` });
      }
      this.formClose.emit();
    } catch(error) {
      console.error("Error saving employee:", error);
      this.notificationService.addNotification({ type: 'alert', title: 'فشل الحفظ', message: 'حدث خطأ أثناء الاتصال بالخادم. قد يكون الرقم الوظيفي مستخدمًا بالفعل.' });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  cancel() {
    this.formClose.emit();
  }
}