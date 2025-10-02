import { Injectable, signal } from '@angular/core';

export interface AlertRule { id: number; name: string; target: 'Employee' | 'CompanyAsset'; dateField: string; reminderDays: number; }

const MOCK_ALERT_RULES: AlertRule[] = [
    { id: 1, name: 'انتهاء جواز السفر', target: 'Employee', dateField: 'passportExpiry', reminderDays: 90 },
    { id: 2, name: 'انتهاء الهوية الإماراتية', target: 'Employee', dateField: 'emiratesIdExpiry', reminderDays: 60 },
    { id: 3, name: 'انتهاء عقد العمل', target: 'Employee', dateField: 'contractEndDate', reminderDays: 60 },
    { id: 4, name: 'انتهاء ملكية المركبة', target: 'CompanyAsset', dateField: 'expiryDate', reminderDays: 30 },
    { id: 5, name: 'انتهاء الرخصة التجارية', target: 'CompanyAsset', dateField: 'expiryDate', reminderDays: 90 },
];

@Injectable({ providedIn: 'root' })
export class SystemSettingsService {
  officialHolidays = signal<{name: string, date: string}[]>([]);
  alertRules = signal<AlertRule[]>(MOCK_ALERT_RULES);
  employeeDateFieldLabels = new Map<string, string>([
    ['passportExpiry', 'جواز السفر'],
    ['emiratesIdExpiry', 'الهوية الإماراتية'],
    ['workPermitExpiry', 'تصريح العمل'],
    ['healthInsuranceExpiry', 'التأمين الصحي'],
    ['contractEndDate', 'عقد العمل'],
    ['proCardExpiry', 'بطاقة المنشأة'],
    ['lawyerLicenseDubaiExpiry', 'رخصة محامي - دبي'],
  ]);
  companyAssetDateFieldLabels = new Map<string, string>([
    ['expiryDate', 'تاريخ انتهاء الوثيقة']
  ]);

  constructor() {}

  addOfficialHoliday = (holiday: { name: string, date: string }) => this.officialHolidays.update(h => [...h, holiday].sort((a,b) => a.date.localeCompare(b.date)));
  removeOfficialHoliday = (date: string) => this.officialHolidays.update(h => h.filter(holiday => holiday.date !== date));
  addAlertRule = (rule: Omit<AlertRule, 'id'>) => { const newId = Math.max(...this.alertRules().map(r => r.id), 0) + 1; this.alertRules.update(r => [...r, {id: newId, ...rule}]); };
  removeAlertRule = (id: number) => this.alertRules.update(r => r.filter(rule => rule.id !== id));
}
