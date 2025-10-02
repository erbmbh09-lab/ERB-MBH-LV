import { Component, ChangeDetectionStrategy, input, output, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataHubService } from '../../services/data-hub.service';
import { Task, ApprovalStep, Comment } from '../../services/task.service';
import { Employee } from '../../services/hr.service';
import { ApprovalWorkflowComponent } from '../approval-workflow/approval-workflow.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [CommonModule, FormsModule, ApprovalWorkflowComponent],
  templateUrl: './task-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class TaskDetailsComponent {
  task = input.required<Task>();
  close = output<void>();

  dataHubService = inject(DataHubService);
  notificationService = inject(NotificationService);
  datePipe = inject(DatePipe);
  
  // A hardcoded user ID for demonstration purposes (مريم المنصوري - Manager)
  private currentUserId = 103;
  
  newComment = signal('');

  get assigner(): Employee | undefined {
    // FIX: Access employees through the correctly typed `dataHubService.hr` property.
    return this.dataHubService.hr.employees().find(e => e.id === this.task().assignerId);
  }

  get assignee(): Employee | undefined {
    // FIX: Access employees through the correctly typed `dataHubService.hr` property.
    return this.dataHubService.hr.employees().find(e => e.id === this.task().assigneeId);
  }

  get canApprove(): boolean {
    const task = this.task();
    if (task.status !== 'pending-approval' || !task.approvalWorkflow) {
      return false;
    }
    const nextApprover = task.approvalWorkflow.find(step => step.status === 'pending');
    return nextApprover?.approverId === this.currentUserId;
  }

  get canRequestApproval(): boolean {
    const task = this.task();
    return task.assigneeId === this.currentUserId && task.status === 'in-progress';
  }
  
  async addComment() {
    const content = this.newComment().trim();
    if (!content) return;
    
    const comment: Comment = {
      authorId: this.currentUserId,
      content,
      timestamp: new Date().toISOString()
    };
    
    const updatedTask = { ...this.task() };
    updatedTask.comments = [...(updatedTask.comments || []), comment];
    
    try {
      await this.dataHubService.tasks.updateTask(updatedTask);
      this.newComment.set('');
    } catch(error) {
      this.notificationService.addNotification({ type: 'alert', title: 'فشل', message: 'لم يتم حفظ التعليق.' });
    }
  }

  async requestApproval() {
    const task = this.task();
    if (!this.canRequestApproval) return;

    const updatedTask: Task = {
        ...task,
        status: 'pending-approval',
        approvalWorkflow: [
            { approverId: 1, status: 'pending' } // General Manager
        ]
    };

    try {
      await this.dataHubService.tasks.updateTask(updatedTask);
    } catch(error) {
      this.notificationService.addNotification({ type: 'alert', title: 'فشل', message: 'لم يتم إرسال طلب الموافقة.' });
    }
  }

  async handleApproval(approved: boolean) {
    const task = this.task();
    if (!this.canApprove) return;

    const updatedWorkflow = task.approvalWorkflow!.map(step => 
      (step.approverId === this.currentUserId && step.status === 'pending')
        ? { ...step, status: approved ? 'approved' : 'rejected', approvedAt: new Date().toISOString() } as ApprovalStep
        : step
    );

    const isWorkflowComplete = updatedWorkflow.every(step => step.status === 'approved');
    let newStatus = task.status;

    if (approved) {
      if (isWorkflowComplete) {
        newStatus = 'completed';
      }
    } else {
      newStatus = 'rejected';
    }

    const updatedTask: Task = {
      ...task,
      approvalWorkflow: updatedWorkflow,
      status: newStatus
    };
    
    try {
      await this.dataHubService.tasks.updateTask(updatedTask);
      if (newStatus !== 'pending-approval') {
        this.close.emit();
      }
    } catch (error) {
       this.notificationService.addNotification({ type: 'alert', title: 'فشل', message: 'لم يتم حفظ حالة الموافقة.' });
    }
  }

  setReminder() {
    const task = this.task();
    const dueDate = this.datePipe.transform(task.dueDate, 'longDate', '', 'ar-AE');
    this.notificationService.addNotification({
      type: 'reminder',
      title: `تذكير للمهمة: ${task.title}`,
      message: `هذه المهمة مستحقة بتاريخ ${dueDate}.`
    });
  }

  isTaskOverdue(): boolean {
    return new Date(this.task().dueDate) < new Date() && this.task().status !== 'completed';
  }
  
  getEmployeeName(employeeId: number): string {
    // FIX: Access employees through the correctly typed `dataHubService.hr` property.
    return this.dataHubService.hr.employees().find(e => e.id === employeeId)?.name || 'غير معروف';
  }

  getPriorityDetails(priority: 'low' | 'medium' | 'high'): { text: string, icon: string, classes: string } {
    switch (priority) {
      case 'high': return { text: 'عالية', icon: 'M12 2L1 21h22M12 6l7.5 13h-15', classes: 'text-red-500 bg-red-100 dark:bg-red-900/50' };
      case 'medium': return { text: 'متوسطة', icon: 'M22 12L12 22 2 12h20z', classes: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50' };
      case 'low': return { text: 'منخفضة', icon: 'M12 22L1 1h22M12 18L4.5 5h15', classes: 'text-green-500 bg-green-100 dark:bg-green-900/50' };
    }
  }
}