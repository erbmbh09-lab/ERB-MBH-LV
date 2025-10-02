import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ThemeService, Theme, Font, PrimaryColor } from '../../services/theme.service';
import { PermissionsComponent } from '../permissions/permissions.component';
import { DataHubService } from '../../services/data-hub.service';
import { NotificationService } from '../../services/notification.service';
import { startWith } from 'rxjs/operators';
import { GoogleCalendarService } from '../../services/google-calendar.service';
import { SystemLog } from '../../services/log.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, PermissionsComponent, ReactiveFormsModule, FormsModule],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class SettingsComponent {
  themeService = inject(ThemeService);
  dataHubService = inject(DataHubService);
  notificationService = inject(NotificationService);
  googleCalendarService = inject(GoogleCalendarService);
  private fb: FormBuilder = inject(FormBuilder);

  activeTab = signal<'appearance' | 'account' | 'permissions' | 'system' | 'alerts' | 'integrations' | 'logs'>('appearance');

  // Mock user data for display
  user = signal({ name: 'محمد بني هاشم', email: 'manager@mb-lawfirm.ae' });

  // State for notification preferences
  notificationPrefs = signal({
    hearings: true,
    caseUpdates: true,
    tasks: true,
    system: false,
  });

  // Holiday management
  newHolidayForm: FormGroup;
  officialHolidays = this.dataHubService.systemSettings.officialHolidays;

  // Alert Rules Management
  alertRules = this.dataHubService.systemSettings.alertRules;
  newAlertRuleForm: FormGroup;
  availableDateFields = signal<{ key: string; label: string; }[]>([]);
  
  // Google Calendar Integration
  googleClientId = signal(localStorage.getItem('googleClientId') || '');

  // System Logs
  logSearchTerm = signal('');
  logUserFilter = signal<number | 'all'>('all');
  logEventTypeFilter = signal<string | 'all'>('all');
  logFromDateFilter = signal('');
  logToDateFilter = signal('');
  
  allLogs = this.dataHubService.logs.logs;
  allUsers = this.dataHubService.hr.employees;

  filteredLogs = computed(() => {
    const term = this.logSearchTerm().toLowerCase();
    const userId = this.logUserFilter();
    const eventType = this.logEventTypeFilter();
    const fromDate = this.logFromDateFilter() ? new Date(this.logFromDateFilter()) : null;
    const toDate = this.logToDateFilter() ? new Date(this.logToDateFilter()) : null;

    if(fromDate) fromDate.setHours(0,0,0,0);
    if(toDate) toDate.setHours(23,59,59,999);

    return this.allLogs().filter(log => {
      const logDate = new Date(log.timestamp);

      const userMatch = userId === 'all' || log.userId === userId;
      const eventMatch = eventType === 'all' || log.eventType === eventType;
      const dateMatch = (!fromDate || logDate >= fromDate) && (!toDate || logDate <= toDate);
      const termMatch = term === '' || log.description.toLowerCase().includes(term) || log.ipAddress.includes(term);

      return userMatch && eventMatch && dateMatch && termMatch;
    });
  });
  
  logEventTypes = computed(() => {
    const types = this.allLogs().map(log => log.eventType);
    return [...new Set(types)];
  });

  themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'فاتح', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />' },
    { value: 'dark', label: 'داكن', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />' },
  ];

  fonts: { value: Font; label: string; style: string }[] = [
    { value: "'Tajawal', sans-serif", label: 'Tajawal', style: "font-family: 'Tajawal', sans-serif;" },
    { value: "'Cairo', sans-serif", label: 'Cairo', style: "font-family: 'Cairo', sans-serif;" },
    { value: "'Noto Sans Arabic', sans-serif", label: 'Noto Sans Arabic', style: "font-family: 'Noto Sans Arabic', sans-serif;" },
  ];

  primaryColors: { value: PrimaryColor; label: string; bgClass: string }[] = [
    { value: 'blue', label: 'أزرق', bgClass: 'bg-blue-500' },
    { value: 'green', label: 'أخضر', bgClass: 'bg-green-500' },
    { value: 'indigo', label: 'بنفسجي', bgClass: 'bg-indigo-500' },
    { value: 'rose', label: 'وردي', bgClass: 'bg-rose-500' },
  ];

  constructor() {
    this.newHolidayForm = this.fb.group({
      name: ['', Validators.required],
      date: ['', Validators.required]
    });

    this.newAlertRuleForm = this.fb.group({
      name: ['', Validators.required],
      target: ['Employee', Validators.required],
      dateField: ['', Validators.required],
      reminderDays: [30, [Validators.required, Validators.min(1)]]
    });

    this.newAlertRuleForm.get('target')!.valueChanges.pipe(startWith('Employee'))
      .subscribe(target => {
        if (target === 'Employee') {
          this.availableDateFields.set(
            Array.from(this.dataHubService.systemSettings.employeeDateFieldLabels, ([key, label]) => ({ key, label }))
          );
        } else {
          this.availableDateFields.set(
            Array.from(this.dataHubService.systemSettings.companyAssetDateFieldLabels, ([key, label]) => ({ key, label }))
          );
        }
        this.newAlertRuleForm.get('dateField')?.setValue('');
      });
  }

  setTheme(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  setFont(font: Font) {
    this.themeService.setFont(font);
  }

  setPrimaryColor(color: PrimaryColor) {
    this.themeService.setPrimaryColor(color);
  }

  toggleNotificationPref(prefKey: 'hearings' | 'caseUpdates' | 'tasks' | 'system') {
    this.notificationPrefs.update(prefs => ({
      ...prefs,
      [prefKey]: !prefs[prefKey]
    }));
  }

  addHoliday() {
    if (this.newHolidayForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى إدخال اسم وتاريخ الإجازة.' });
      return;
    }
    const { name, date } = this.newHolidayForm.value;
    if (this.officialHolidays().some(h => h.date === date)) {
      this.notificationService.addNotification({ type: 'alert', title: 'تكرار', message: 'هذا التاريخ موجود بالفعل في قائمة الإجازات.' });
      return;
    }
    this.dataHubService.systemSettings.addOfficialHoliday({ name, date });
    this.newHolidayForm.reset();
  }

  removeHoliday(date: string) {
    if (confirm('هل أنت متأكد من حذف هذه الإجازة؟')) {
      this.dataHubService.systemSettings.removeOfficialHoliday(date);
    }
  }

  addAlertRule() {
    if (this.newAlertRuleForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء جميع الحقول لإنشاء قاعدة تنبيه.' });
      return;
    }
    this.dataHubService.systemSettings.addAlertRule(this.newAlertRuleForm.getRawValue());
    this.newAlertRuleForm.reset({ target: 'Employee', reminderDays: 30 });
  }

  removeAlertRule(ruleId: number) {
    if (confirm('هل أنت متأكد من حذف قاعدة التنبيه هذه؟')) {
      this.dataHubService.systemSettings.removeAlertRule(ruleId);
    }
  }

  saveGoogleClientId() {
    const clientId = this.googleClientId().trim();
    if (clientId) {
      localStorage.setItem('googleClientId', clientId);
      this.googleCalendarService.initClient(clientId);
      this.notificationService.addNotification({ type: 'success', title: 'تم الحفظ', message: 'تم حفظ Google Client ID بنجاح.' });
    } else {
      this.notificationService.addNotification({ type: 'alert', title: 'حقل فارغ', message: 'يرجى إدخال Google Client ID.' });
    }
  }

  getLogUserName(userId: number): string {
    return this.allUsers().find(u => u.id === userId)?.name || `مستخدم غير معروف (${userId})`;
  }
}
