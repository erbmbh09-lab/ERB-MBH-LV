import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataHubService } from '../../services/data-hub.service';
import { Employee } from '../../services/hr.service';
import { EmployeeFormComponent } from '../employee-form/employee-form.component';
import { CompanyAssetsComponent } from '../company-assets/company-assets.component';
import { HrAgendaComponent } from '../hr-agenda/hr-agenda.component';
import { HrNotificationsComponent } from '../hr-notifications/hr-notifications.component';

@Component({
  selector: 'app-hr-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EmployeeFormComponent,
    CompanyAssetsComponent,
    HrAgendaComponent,
    HrNotificationsComponent
  ],
  templateUrl: './hr-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class HrManagementComponent {
  dataHubService = inject(DataHubService);

  activeTab = signal<'list' | 'agenda' | 'assets' | 'notifications'>('list');
  activeView = signal<'list' | 'form'>('list');
  selectedEmployee = signal<Employee | null>(null);
  searchTerm = signal('');
  
  allEmployees = this.dataHubService.hr.employees;

  filteredEmployees = computed(() => {
    const term = this.searchTerm().toLowerCase();
    
    return this.allEmployees().filter(employee => {
      return !term ||
        employee.name.toLowerCase().includes(term) ||
        employee.id.toString().includes(term) ||
        employee.role.toLowerCase().includes(term);
    });
  });

  showEmployeeForm(employee: Employee | null) {
    this.selectedEmployee.set(employee);
    this.activeView.set('form');
  }

  onFormClosed() {
    this.activeView.set('list');
    this.selectedEmployee.set(null);
  }
}