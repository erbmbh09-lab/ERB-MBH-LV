import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';

// --- INTERFACES ---
export interface Employee { id: number; name: string; role: string; nationality?: string; dateOfBirth?: string; gender?: 'ذكر' | 'أنثى'; maritalStatus?: string; mobilePhone: string; address?: string; joinDate: string; department?: string; branch: 'دبي' | 'الشارقة' | 'عجمان'; contractType: 'كامل' | 'جزئي'; contractEndDate?: string; contractEndReminderDays?: number; directManagerId?: number; residencyStatus?: string; proCardExpiry?: string; proCardReminderDays?: number; lawyerLicenseDubaiExpiry?: string; lawyerLicenseDubaiReminderDays?: number; lawyerLicenseSharjahExpiry?: string; lawyerLicenseSharjahReminderDays?: number; lawyerLicenseAjmanExpiry?: string; lawyerLicenseAjmanReminderDays?: number; lawyerLicenseAbuDhabiExpiry?: string; lawyerLicenseAbuDhabiReminderDays?: number; hasHealthIssues?: boolean; healthIssuesDetails?: string; emergencyContacts?: { name: string; relationship: string; phone: string; }[]; passportNo?: string; passportExpiry?: string; passportExpiryReminderDays?: number; emiratesIdNo?: string; emiratesIdExpiry?: string; emiratesIdExpiryReminderDays?: number; workPermitNo?: string; workPermitExpiry?: string; workPermitReminderDays?: number; healthInsuranceExpiry?: string; healthInsuranceExpiryReminderDays?: number; bankName?: string; iban?: string; accountNo?: string; salaryPaymentMethod?: 'wps' | 'bank transfer' | 'cash'; salaryDetails?: { basic: number; housing: number; transport: number; other: number; }; workingHours?: { startTime: string; endTime: string }; externalMissions?: ExternalMission[]; attendanceRecords?: AttendanceRecord[]; deductions?: Deduction[]; annualLeaves?: Leave[]; sickLeaves?: Leave[]; otherLeaves?: OtherLeave[]; appraisals?: Appraisal[]; warnings?: Warning[]; trainings?: Training[]; requests?: Request[]; }
export interface ExternalMission { date: string; fromTime: string; toTime: string; destination: string; reason: string; }
export interface AttendanceRecord { date: string; signIn: string; signOut: string; lateMinutes: number; earlyLeaveMinutes: number; }
export interface Deduction { date: string; totalSalary: number; amount: number; reason: string; }
export interface Leave { date: string; type: string; from: string; to: string; days: number; remaining: number; }
export interface OtherLeave extends Leave { leaveType: string; }
export interface Appraisal { date: string; type: string; }
export interface Warning { date: string; type: string; reason: string; }
export interface Training { date: string; type: string; }
export type LeaveRequestType = 'إجازة سنوية' | 'إجازة مرضية' | 'إجازة دراسية' | 'إجازة أمومة' | 'إجازة أبوية' | 'إجازة أخرى';
export type CertificateRequestType = 'شهادة راتب' | 'شهادة خبرة' | 'شهادة لا مانع' | 'بدل إجازة سنوية';
export type RequestType = LeaveRequestType | CertificateRequestType;
export interface Request { submissionDate: string; requestType: RequestType; from?: string; to?: string; details?: string; directorApproval: 'قيد الانتظار' | 'موافق عليه' | 'مرفوض'; hrApproval: 'قيد الانتظار' | 'موافق عليه' | 'مرفوض'; }
export interface CompanyAsset { id: number; category: 'Office' | 'Vehicle/Resource'; branch: 'دبي' | 'الشارقة' | 'عجمان' | 'عام'; name: string; documentType: string; issueDate: string; expiryDate: string; notes?: string; details?: { [key: string]: string }; }
export interface AgendaEvent { id: number; title: string; date: string; startTime: string; endTime: string; attendees: string[]; location?: string; description?: string; color: 'blue' | 'green' | 'indigo' | 'rose' | 'yellow' | 'red'; }

const MOCK_EMPLOYEES: Employee[] = [
    { id: 1, name: 'محمد بني هاشم', role: 'المدير العام', mobilePhone: '050xxxxxxx', joinDate: '2010-01-01', branch: 'دبي', contractType: 'كامل', passportExpiry: '2028-12-01', emiratesIdExpiry: '2026-08-15' },
    { id: 101, name: 'أحمد محمود', role: 'محامي أول', mobilePhone: '050xxxxxxx', joinDate: '2015-03-10', branch: 'دبي', contractType: 'كامل', directManagerId: 1, passportExpiry: '2027-05-20', emiratesIdExpiry: '2025-07-11' },
    { id: 102, name: 'خالد العامري', role: 'محامي', mobilePhone: '050xxxxxxx', joinDate: '2018-09-01', branch: 'الشارقة', contractType: 'كامل', directManagerId: 101 },
    { id: 103, name: 'مريم المنصوري', role: 'مستشار قانوني', mobilePhone: '050xxxxxxx', joinDate: '2017-05-20', branch: 'دبي', contractType: 'كامل', directManagerId: 1 },
    { id: 104, name: 'فاطمة الزهراء', role: 'سكرتيرة قانونية', mobilePhone: '050xxxxxxx', joinDate: '2020-02-15', branch: 'دبي', contractType: 'كامل', directManagerId: 103 },
    { id: 105, name: 'علي حسن', role: 'باحث قانوني', mobilePhone: '050xxxxxxx', joinDate: '2021-11-01', branch: 'دبي', contractType: 'كامل', directManagerId: 103 },
];

const MOCK_ASSETS: CompanyAsset[] = [
    { id: 1, category: 'Office', branch: 'دبي', name: 'الرخصة التجارية - دبي', documentType: 'رخصة تجارية', issueDate: '2023-07-01', expiryDate: '2024-06-30' },
    { id: 2, category: 'Vehicle/Resource', branch: 'دبي', name: 'تويوتا كامري', documentType: 'ملكية مركبة', issueDate: '2022-03-15', expiryDate: '2025-03-14', details: { 'رقم اللوحة': 'دبي A 12345' } },
];

const MOCK_AGENDA_EVENTS: AgendaEvent[] = [
    { id: 1, title: 'اجتماع فريق القضايا التجارية', date: new Date().toISOString().split('T')[0], startTime: '10:00', endTime: '11:00', attendees: ['أحمد محمود', 'مريم المنصوري'], location: 'قاعة الاجتماعات', color: 'blue' }
];

@Injectable({ providedIn: 'root' })
export class HrService {
  private http = inject(HttpClient);

  employees = signal<Employee[]>([]);
  companyAssets = signal<CompanyAsset[]>([]);
  agendaEvents = signal<AgendaEvent[]>([]);

  constructor() {
    this.employees.set(MOCK_EMPLOYEES);
    this.companyAssets.set(MOCK_ASSETS);
    this.agendaEvents.set(MOCK_AGENDA_EVENTS);
  }

  addEmployee(employee: Employee): Promise<Employee> {
    return firstValueFrom(this.http.post<Employee>('/api/employees', employee).pipe(
      tap(newEmployee => this.employees.update(e => [...e, newEmployee]))
    ));
  }
  updateEmployee(updatedEmployee: Employee): Promise<Employee> {
    return firstValueFrom(this.http.put<Employee>(`/api/employees/${updatedEmployee.id}`, updatedEmployee).pipe(
      tap(returnedEmployee => this.employees.update(e => e.map(emp => emp.id === returnedEmployee.id ? returnedEmployee : emp)))
    ));
  }
  addCompanyAsset(asset: Omit<CompanyAsset, 'id'>): Promise<CompanyAsset> {
    return firstValueFrom(this.http.post<CompanyAsset>('/api/company-assets', asset).pipe(
      tap(newAsset => this.companyAssets.update(a => [...a, newAsset]))
    ));
  }
  updateCompanyAsset(updatedAsset: CompanyAsset): Promise<CompanyAsset> {
    return firstValueFrom(this.http.put<CompanyAsset>(`/api/company-assets/${updatedAsset.id}`, updatedAsset).pipe(
      tap(returnedAsset => this.companyAssets.update(a => a.map(asset => asset.id === returnedAsset.id ? returnedAsset : asset)))
    ));
  }
  deleteCompanyAsset(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/company-assets/${id}`).pipe(
      tap(() => this.companyAssets.update(a => a.filter(asset => asset.id !== id)))
    ));
  }
  addAgendaEvent(event: Omit<AgendaEvent, 'id'>): Promise<AgendaEvent> {
    return firstValueFrom(this.http.post<AgendaEvent>('/api/agenda-events', event).pipe(
      tap(newEvent => this.agendaEvents.update(e => [...e, newEvent]))
    ));
  }
  updateAgendaEvent(updatedEvent: AgendaEvent): Promise<AgendaEvent> {
    return firstValueFrom(this.http.put<AgendaEvent>(`/api/agenda-events/${updatedEvent.id}`, updatedEvent).pipe(
      tap(returnedEvent => this.agendaEvents.update(e => e.map(event => event.id === returnedEvent.id ? returnedEvent : event)))
    ));
  }
  deleteAgendaEvent(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/agenda-events/${id}`).pipe(
      tap(() => this.agendaEvents.update(e => e.filter(event => event.id !== id)))
    ));
  }
}
