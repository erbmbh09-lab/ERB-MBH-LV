import { Injectable, signal, computed, inject } from '@angular/core';
import { DataHubService } from './data-hub.service';

export type NotificationType = 'reminder' | 'alert' | 'info' | 'success';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private dataHubService = inject(DataHubService);
  private nextId = 1;
  notifications = signal<Notification[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  constructor() {
    // Notifications are now generated dynamically by calling generateSystemNotifications()
  }
  
  generateSystemNotifications(): void {
    const systemNotifications = this.getSystemNotifications();
    this.notifications.set(systemNotifications);
    this.nextId = systemNotifications.length + 1;
  }

  addNotification(notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const existing = this.notifications().find(n => n.title === notificationData.title && n.message === notificationData.message);
    if (existing) {
      return; // Avoid duplicates
    }
    const newNotification: Notification = {
      ...notificationData,
      id: this.nextId++,
      timestamp: new Date(),
      read: false,
    };
    this.notifications.update(notifications => [newNotification, ...notifications]);
  }

  markAsRead(id: number) {
    this.notifications.update(notifications =>
      notifications.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }

  markAllAsRead() {
    this.notifications.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
  }

  // --- Notification Generation (Simulating Backend Logic) ---
  getSystemNotifications(): Notification[] {
    const notifications: Omit<Notification, 'id' | 'timestamp' | 'read'>[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    // FIX: Access employees through the correctly typed `dataHubService.hr` property.
    const employees = this.dataHubService.hr.employees();
    // FIX: Access alertRules through the correctly typed `dataHubService.systemSettings` property.
    const employeeRules = this.dataHubService.systemSettings.alertRules().filter(r => r.target === 'Employee');

    for (const emp of employees) {
      for (const rule of employeeRules) {
        const dateStr = emp[rule.dateField as keyof typeof emp] as string | undefined;

        if (dateStr) {
          const expiryDate = new Date(dateStr);
          const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysRemaining <= rule.reminderDays) {
            const isExpired = daysRemaining < 0;
            // FIX: Access employeeDateFieldLabels through the correctly typed `dataHubService.systemSettings` property.
            const message = `مستند "${this.dataHubService.systemSettings.employeeDateFieldLabels.get(rule.dateField) || rule.name}" للموظف "${emp.name}" ${isExpired ? `منتهي منذ ${-daysRemaining} يوم` : `سينتهي خلال ${daysRemaining} يوم`}.`;
            notifications.push({ type: 'alert', title: `تنبيه: ${rule.name}`, message });
          }
        }
      }
    }

    // FIX: Access companyAssets through the correctly typed `dataHubService.hr` property.
    const assets = this.dataHubService.hr.companyAssets();
    // FIX: Access alertRules through the correctly typed `dataHubService.systemSettings` property.
    const assetRules = this.dataHubService.systemSettings.alertRules().filter(r => r.target === 'CompanyAsset');

    for (const asset of assets) {
       for (const rule of assetRules) {
        const dateStr = asset[rule.dateField as keyof typeof asset] as string | undefined;
        if (dateStr) {
          const expiryDate = new Date(dateStr);
          const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysRemaining <= rule.reminderDays) {
             const isExpired = daysRemaining < 0;
             const message = `مستند "${asset.name}" (${asset.documentType}) ${isExpired ? `منتهي منذ ${-daysRemaining} يوم` : `سينتهي خلال ${daysRemaining} يوم`}.`;
             notifications.push({ type: 'reminder', title: `تنبيه: ${rule.name}`, message });
          }
        }
      }
    }
    
    // FIX: Access sessions through the correctly typed `dataHubService.cases` property.
    const upcomingSession = this.dataHubService.cases.sessions().find(s => {
        const sessionDate = new Date(s.sessionDate);
        sessionDate.setHours(0,0,0,0);
        const diffDays = Math.ceil((sessionDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return diffDays >= 0 && diffDays <= 7;
    });
    if (upcomingSession) {
        notifications.push({
            type: 'info',
            title: 'جلسة قادمة',
            message: `لديك جلسة قادمة للقضية ${upcomingSession.caseId} بتاريخ ${new Date(upcomingSession.sessionDate).toLocaleDateString('ar-AE-u-nu-latn')}.`
        });
    }

    // FIX: Access cases through the correctly typed `dataHubService.cases` property.
    const closedCase = this.dataHubService.cases.cases().find(c => c.status === 'مغلقة');
    if (closedCase) {
        notifications.push({
            type: 'success',
            title: 'تم إغلاق قضية',
            message: `تم إغلاق القضية ${closedCase.id} الخاصة بالموكل ${closedCase.clientName}.`
        });
    }

    // Deduplicate and add IDs
    const uniqueNotifications = Array.from(new Map(notifications.map(n => [`${n.title}-${n.message}`, n])).values());
    
    return uniqueNotifications.map((n, index) => ({
      ...n,
      id: index + 1,
      timestamp: new Date(),
      read: false
    })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}
