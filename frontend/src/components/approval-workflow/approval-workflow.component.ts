import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ApprovalStep } from '../../services/task.service';
import { DataHubService } from '../../services/data-hub.service';

@Component({
  selector: 'app-approval-workflow',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './approval-workflow.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApprovalWorkflowComponent {
  workflow = input.required<ApprovalStep[]>();
  dataHubService = inject(DataHubService);

  getEmployeeName(employeeId: number): string {
    // FIX: Access employees through the correctly typed `dataHubService.hr` property.
    return this.dataHubService.hr.employees().find(e => e.id === employeeId)?.name || `ID: ${employeeId}`;
  }
}