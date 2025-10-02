import { Injectable, inject, signal } from '@angular/core';

import { AgreementService } from './agreement.service';
import { CallLogService } from './call-log.service';
import { CaseService } from './case.service';
import { ClientService } from './client.service';
import { ConsultationService } from './consultation.service';
import { FinancialService } from './financial.service';
import { HrService } from './hr.service';
import { SystemSettingsService } from './system-settings.service';
import { TaskService } from './task.service';
import { CustomerRequestService } from './customer-request.service';
import { LogService } from './log.service';

@Injectable({
  providedIn: 'root'
})
export class DataHubService {
  agreements = inject(AgreementService);
  callLogs = inject(CallLogService);
  cases = inject(CaseService);
  clients = inject(ClientService);
  consultations = inject(ConsultationService);
  financial = inject(FinancialService);
  hr = inject(HrService);
  systemSettings = inject(SystemSettingsService);
  tasks = inject(TaskService);
  customerRequests = inject(CustomerRequestService);
  logs = inject(LogService);

  // Shared state that cuts across multiple domains
  caseToOpen = signal<string | null>(null);

  constructor() { }
}
