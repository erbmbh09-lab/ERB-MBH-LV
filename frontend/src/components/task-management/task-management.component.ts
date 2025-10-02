import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataHubService } from '../../services/data-hub.service';
import { Task } from '../../services/task.service';
import { Employee } from '../../services/hr.service';
import { TaskDetailsComponent } from '../task-details/task-details.component';
import { TaskFormComponent } from '../task-form/task-form.component';

type StatusFilter = 'all' | 'new' | 'in-progress' | 'pending-approval' | 'completed';
type AssigneeFilter = 'all' | 'mine' | 'assigned-by-me';

@Component({
  selector: 'app-task-management',
  standalone: true,
  imports: [CommonModule, TaskDetailsComponent, TaskFormComponent, FormsModule],
  templateUrl: './task-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskManagementComponent {
  dataHubService = inject(DataHubService);
  
  // A hardcoded user ID for demonstration purposes (مريم المنصوري - Manager)
  private currentUserId = 103;

  isDetailsModalVisible = signal(false);
  isFormModalVisible = signal(false);
  selectedTask = signal<Task | null>(null);

  statusFilter = signal<StatusFilter>('all');
  assigneeFilter = signal<AssigneeFilter>('mine');

  // FIX: Access tasks through the correctly typed `dataHubService.tasks` property.
  allTasks = this.dataHubService.tasks.tasks;
  // FIX: Access employees through the correctly typed `dataHubService.hr` property.
  allEmployees = this.dataHubService.hr.employees;
  
  filteredTasks = computed(() => {
    const status = this.statusFilter();
    const assignee = this.assigneeFilter();
    
    return this.allTasks().filter(task => {
      const statusMatch = status === 'all' || task.status === status;
      
      let assigneeMatch = true;
      if (assignee === 'mine') {
        assigneeMatch = task.assigneeId === this.currentUserId;
      } else if (assignee === 'assigned-by-me') {
        assigneeMatch = task.assignerId === this.currentUserId;
      }
      
      return statusMatch && assigneeMatch;
    });
  });
  
  dashboardStats = computed(() => {
    const tasks = this.allTasks();
    const now = new Date();
    return {
      newTasks: tasks.filter(t => t.status === 'new' && t.assigneeId === this.currentUserId).length,
      pendingApproval: tasks.filter(t => t.status === 'pending-approval' && t.approvalWorkflow?.some(s => s.approverId === this.currentUserId && s.status === 'pending')).length,
      overdue: tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < now).length,
    };
  });

  openDetailsModal(task: Task) {
    this.selectedTask.set(task);
    this.isDetailsModalVisible.set(true);
  }
  
  openFormModal(task: Task | null = null) {
    this.selectedTask.set(task);
    this.isFormModalVisible.set(true);
  }

  closeModals() {
    this.isDetailsModalVisible.set(false);
    this.isFormModalVisible.set(false);
    this.selectedTask.set(null);
  }
  
  getEmployeeName(employeeId: number): string {
    return this.allEmployees().find(e => e.id === employeeId)?.name || 'غير معروف';
  }
  
  getPriorityClass(priority: 'low' | 'medium' | 'high'): string {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusClass(status: Task['status']): string {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'in-progress': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300';
      case 'pending-approval': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  getStatusText(status: Task['status']): string {
    const map: Record<Task['status'], string> = {
        'new': 'جديدة',
        'in-progress': 'قيد التنفيذ',
        'pending-approval': 'بانتظار الموافقة',
        'completed': 'مكتملة',
        'rejected': 'مرفوضة'
    };
    return map[status];
  }

  isTaskOverdue(task: Task): boolean {
    return new Date(task.dueDate) < new Date() && task.status !== 'completed';
  }
}
