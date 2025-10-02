import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DataHubService } from '../../services/data-hub.service';
import { CompanyAsset, Employee } from '../../services/hr.service';

interface Alert {
  ownerName: string;
  ownerId: number | string;
  documentType: string;
  expiryDate: string;
  daysRemaining: number;
  branch?: string;
}

@Component({
  selector: 'app-hr-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hr-notifications.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class HrNotificationsComponent {
  dataHubService = inject(DataHubService);

  private today = new Date();

  employeeAlerts = computed<Alert[]>(() => {
    const alerts: Alert[] = [];
    // FIX: Access employees through the correctly typed `dataHubService.hr` property.
    const employees = this.dataHubService.hr.employees();
    // FIX: Access alertRules through the correctly typed `dataHubService.systemSettings` property.
    const employeeRules = this.dataHubService.systemSettings.alertRules().filter(r => r.target === 'Employee');

    for (const emp of employees) {
      for (const rule of employeeRules) {
        const dateStr = emp[rule.dateField as keyof Employee] as string | undefined;

        if (dateStr) {
          const expiryDate = new Date(dateStr);
          const daysRemaining = Math.ceil((expiryDate.getTime() - this.today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysRemaining <= rule.reminderDays) {
            alerts.push({
              ownerName: emp.name,
              ownerId: emp.id,
              documentType: rule.name,
              expiryDate: dateStr,
              daysRemaining: daysRemaining,
            });
          }
        }
      }
    }
    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  });

  companyAlerts = computed<Alert[]>(() => {
    const alerts: Alert[] = [];
    // FIX: Access companyAssets through the correctly typed `dataHubService.hr` property.
    const assets = this.dataHubService.hr.companyAssets();
    // FIX: Access alertRules through the correctly typed `dataHubService.systemSettings` property.
    const assetRules = this.dataHubService.systemSettings.alertRules().filter(r => r.target === 'CompanyAsset');

    for (const asset of assets) {
       for (const rule of assetRules) {
        const dateStr = asset[rule.dateField as keyof CompanyAsset] as string | undefined;

        if (dateStr) {
          const expiryDate = new Date(dateStr);
          const daysRemaining = Math.ceil((expiryDate.getTime() - this.today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysRemaining <= rule.reminderDays) {
            alerts.push({
              ownerName: asset.name,
              ownerId: asset.id,
              documentType: rule.name,
              expiryDate: dateStr,
              daysRemaining: daysRemaining,
              branch: asset.branch
            });
          }
        }
      }
    }
    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  });
  
  getUrgencyClass(daysRemaining: number): string {
    if (daysRemaining < 0) {
      return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-300';
    } if (daysRemaining <= 15) {
      return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-300';
    } else if (daysRemaining <= 30) {
      return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 border-yellow-300';
    } else {
      return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-300';
    }
  }
}