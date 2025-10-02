// FIX: Add declarations for Jasmine globals to satisfy TypeScript compiler when types are not found in the environment.
declare var jasmine: any;
declare function describe(description: string, specDefinitions: () => void): void;
declare function it(expectation: string, assertion: (() => void) | (() => Promise<void>), timeout?: number): void;
declare function beforeEach(action: (() => void) | (() => Promise<void>), timeout?: number): void;
declare function expect(actual: any): any;
declare function spyOn(object: any, method: string): any;

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SettingsComponent } from './settings.component';
import { ThemeService, Theme, Font, PrimaryColor } from '../../services/theme.service';
import { DataHubService } from '../../services/data-hub.service';
import { AlertRule } from '../../services/system-settings.service';
import { NotificationService } from '../../services/notification.service';
import { GoogleCalendarService } from '../../services/google-calendar.service';

// Mock Services
class MockThemeService {
  setTheme = jasmine.createSpy('setTheme');
  setFont = jasmine.createSpy('setFont');
  setPrimaryColor = jasmine.createSpy('setPrimaryColor');
  theme = signal<Theme>('dark');
  font = signal<Font>("'Tajawal', sans-serif");
  primaryColor = signal<PrimaryColor>('blue');
}

class MockDataHubService {
  systemSettings = {
    officialHolidays: signal<{ name: string; date: string }[]>([]),
    alertRules: signal<AlertRule[]>([]),
    employeeDateFieldLabels: new Map([['passportExpiry', 'جواز السفر']]),
    companyAssetDateFieldLabels: new Map([['expiryDate', 'تاريخ انتهاء الوثيقة']]),
    addOfficialHoliday: jasmine.createSpy('addOfficialHoliday'),
    removeOfficialHoliday: jasmine.createSpy('removeOfficialHoliday'),
    addAlertRule: jasmine.createSpy('addAlertRule'),
    removeAlertRule: jasmine.createSpy('removeAlertRule'),
  };
}

class MockNotificationService {
  addNotification = jasmine.createSpy('addNotification');
}

class MockGoogleCalendarService {
  initClient = jasmine.createSpy('initClient');
  isReady = signal(true);
  isSignedIn = signal(false);
  userProfile = signal(null);
}

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let themeService: MockThemeService;
  let dataHubService: MockDataHubService;
  let notificationService: MockNotificationService;
  let googleCalendarService: MockGoogleCalendarService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SettingsComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ThemeService, useClass: MockThemeService },
        { provide: DataHubService, useClass: MockDataHubService },
        { provide: NotificationService, useClass: MockNotificationService },
        { provide: GoogleCalendarService, useClass: MockGoogleCalendarService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService) as any;
    dataHubService = TestBed.inject(DataHubService) as any;
    notificationService = TestBed.inject(NotificationService) as any;
    googleCalendarService = TestBed.inject(GoogleCalendarService) as any;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Appearance Settings', () => {
    it('should call ThemeService to set theme', () => {
      component.setTheme('light');
      expect(themeService.setTheme).toHaveBeenCalledWith('light');
    });

    it('should call ThemeService to set font', () => {
      component.setFont("'Cairo', sans-serif");
      expect(themeService.setFont).toHaveBeenCalledWith("'Cairo', sans-serif");
    });

    it('should call ThemeService to set primary color', () => {
      component.setPrimaryColor('green');
      expect(themeService.setPrimaryColor).toHaveBeenCalledWith('green');
    });
  });
  
  describe('Notification Preferences', () => {
    it('should toggle notification preferences', () => {
        const initialValue = component.notificationPrefs().hearings;
        component.toggleNotificationPref('hearings');
        expect(component.notificationPrefs().hearings).toBe(!initialValue);
    });
  });

  describe('Holiday Management', () => {
    it('should add a holiday when form is valid and date is not a duplicate', () => {
      component.newHolidayForm.setValue({ name: 'New Holiday', date: '2025-12-25' });
      component.addHoliday();
      expect(dataHubService.systemSettings.addOfficialHoliday).toHaveBeenCalledWith({ name: 'New Holiday', date: '2025-12-25' });
      expect(component.newHolidayForm.value).toEqual({ name: null, date: null });
    });

    it('should show notification if holiday form is invalid', () => {
      component.addHoliday();
      expect(notificationService.addNotification).toHaveBeenCalled();
      expect(dataHubService.systemSettings.addOfficialHoliday).not.toHaveBeenCalled();
    });

    it('should show notification for duplicate holiday date', () => {
      dataHubService.systemSettings.officialHolidays.set([{ name: 'Existing Holiday', date: '2025-12-25' }]);
      component.newHolidayForm.setValue({ name: 'New Holiday', date: '2025-12-25' });
      component.addHoliday();
      expect(notificationService.addNotification).toHaveBeenCalled();
      expect(dataHubService.systemSettings.addOfficialHoliday).not.toHaveBeenCalled();
    });
    
    it('should remove a holiday when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.removeHoliday('2025-01-01');
      expect(dataHubService.systemSettings.removeOfficialHoliday).toHaveBeenCalledWith('2025-01-01');
    });

    it('should NOT remove a holiday when not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.removeHoliday('2025-01-01');
      expect(dataHubService.systemSettings.removeOfficialHoliday).not.toHaveBeenCalled();
    });
  });

  describe('Alert Rule Management', () => {
    it('should update available date fields when target changes', () => {
      component.newAlertRuleForm.get('target')?.setValue('CompanyAsset');
      fixture.detectChanges();
      // FIX: Replace non-existent component property with the expected value derived from the mock service.
      expect(component.availableDateFields()).toEqual(
        Array.from(dataHubService.systemSettings.companyAssetDateFieldLabels, ([key, label]) => ({ key, label }))
      );

      component.newAlertRuleForm.get('target')?.setValue('Employee');
      fixture.detectChanges();
      // FIX: Replace non-existent component property with the expected value derived from the mock service.
      expect(component.availableDateFields()).toEqual(
        Array.from(dataHubService.systemSettings.employeeDateFieldLabels, ([key, label]) => ({ key, label }))
      );
    });
    
    it('should add an alert rule when form is valid', () => {
      const rule = { name: 'Test Rule', target: 'Employee', dateField: 'passportExpiry', reminderDays: 45 };
      component.newAlertRuleForm.setValue(rule);
      component.addAlertRule();
      expect(dataHubService.systemSettings.addAlertRule).toHaveBeenCalledWith(rule);
    });

    it('should remove an alert rule when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.removeAlertRule(1);
      expect(dataHubService.systemSettings.removeAlertRule).toHaveBeenCalledWith(1);
    });
  });

  describe('Integrations', () => {
    it('should save Google Client ID and initialize client', () => {
        spyOn(localStorage, 'setItem');
        const clientId = 'test-client-id';
        component.googleClientId.set(clientId);
        component.saveGoogleClientId();

        expect(localStorage.setItem).toHaveBeenCalledWith('googleClientId', clientId);
        expect(googleCalendarService.initClient).toHaveBeenCalledWith(clientId);
        expect(notificationService.addNotification).toHaveBeenCalledWith(jasmine.objectContaining({ type: 'success' }));
    });
    
    it('should show an error if Google Client ID is empty', () => {
        spyOn(localStorage, 'setItem');
        component.googleClientId.set('');
        component.saveGoogleClientId();

        expect(localStorage.setItem).not.toHaveBeenCalled();
        expect(googleCalendarService.initClient).not.toHaveBeenCalled();
        expect(notificationService.addNotification).toHaveBeenCalledWith(jasmine.objectContaining({ type: 'alert' }));
    });
  });
});
