import { Component, ChangeDetectionStrategy, input, output, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { DataHubService } from '../../services/data-hub.service';
import { Task } from '../../services/task.service';
import { NotificationService } from '../../services/notification.service';
import { GoogleCalendarService, GoogleCalendarEvent } from '../../services/google-calendar.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FileUploadComponent],
  templateUrl: './task-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class TaskFormComponent {
  task = input<Task | null>();
  relatedCaseId = input<string | null>(null);
  close = output<void>();

  private fb: FormBuilder = inject(FormBuilder);
  private dataHubService = inject(DataHubService);
  private notificationService = inject(NotificationService);
  private datePipe = inject(DatePipe);
  private googleCalendarService = inject(GoogleCalendarService);
  
  // Hardcoded user for demo
  private currentUserId = 103; 

  allEmployees = this.dataHubService.hr.employees;
  
  isEditMode = computed(() => !!this.task());

  taskForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    assigneeId: [null as number | null, Validators.required],
    dueDate: ['', Validators.required],
    priority: ['medium' as Task['priority'], Validators.required],
    relatedCaseId: ['']
  });

  constructor() {
    effect(() => {
      const taskToEdit = this.task();
      this.taskForm.reset({ priority: 'medium' });
      if (taskToEdit) {
        this.taskForm.patchValue({
          ...taskToEdit,
          dueDate: this.datePipe.transform(taskToEdit.dueDate, 'yyyy-MM-dd')
        });
      } else {
        const caseId = this.relatedCaseId();
        if (caseId) {
          this.taskForm.patchValue({ relatedCaseId: caseId });
        }
      }
    });
  }

  async onSubmit() {
    if (this.taskForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء جميع الحقول الإلزامية.' });
      return;
    }

    const formValue = this.taskForm.getRawValue();
    
    try {
      if (this.isEditMode()) {
        const updatedTask: Task = {
          ...this.task()!,
          title: formValue.title!,
          description: formValue.description!,
          assigneeId: formValue.assigneeId!,
          dueDate: formValue.dueDate!,
          priority: formValue.priority!,
          relatedCaseId: formValue.relatedCaseId || undefined
        };
        const returnedTask = await this.dataHubService.tasks.updateTask(updatedTask);
        this.notificationService.addNotification({ type: 'success', title: 'تم التحديث', message: `تم تحديث المهمة "${returnedTask.title}".` });
        await this.syncTaskToGoogleCalendar(returnedTask);
      } else {
        const isHighPriority = formValue.priority === 'high';
        const newStatus = isHighPriority ? 'pending-approval' : 'new';
        const approvalWorkflow = isHighPriority 
            ? [{ approverId: 1, status: 'pending' as const }] // Approver ID 1 is the general manager
            : undefined;

        const newTaskData: Omit<Task, 'id'> = {
          title: formValue.title!,
          description: formValue.description!,
          type: 'assigned',
          status: newStatus,
          priority: formValue.priority!,
          assignerId: this.currentUserId,
          assigneeId: formValue.assigneeId!,
          createdAt: new Date().toISOString(),
          dueDate: formValue.dueDate!,
          relatedCaseId: formValue.relatedCaseId || undefined,
          approvalWorkflow: approvalWorkflow
        };
        const addedTask = await this.dataHubService.tasks.addTask(newTaskData);
        this.notificationService.addNotification({ type: 'success', title: 'تم الإنشاء', message: `تم إنشاء مهمة جديدة.` });
        await this.syncTaskToGoogleCalendar(addedTask);
      }
      this.close.emit();
    } catch (error) {
      console.error("Error saving task:", error);
      this.notificationService.addNotification({ type: 'alert', title: 'فشل الحفظ', message: 'حدث خطأ أثناء الاتصال بالخادم.' });
    }
  }

  setReminder() {
    const title = this.taskForm.get('title')?.value;
    const dueDateValue = this.taskForm.get('dueDate')?.value;

    if (!title || !dueDateValue) {
      this.notificationService.addNotification({
        type: 'alert',
        title: 'معلومات غير كافية',
        message: 'الرجاء إدخال عنوان وتاريخ استحقاق المهمة لضبط تذكير.'
      });
      return;
    }

    const dueDate = this.datePipe.transform(dueDateValue, 'longDate', '', 'ar-AE');
    this.notificationService.addNotification({
      type: 'reminder',
      title: `تذكير للمهمة: ${title}`,
      message: `هذه المهمة مستحقة بتاريخ ${dueDate}.`
    });
  }

  private async syncTaskToGoogleCalendar(task: Task) {
    if (!this.googleCalendarService.isSignedIn() || !task.dueDate) {
        return;
    }

    // Create a timezone-safe date object for an all-day event
    const dueDate = new Date(task.dueDate + 'T00:00:00');
    const endDate = new Date(dueDate);
    endDate.setDate(dueDate.getDate() + 1);

    const eventDetails: Partial<GoogleCalendarEvent> = {
        summary: `مهمة: ${task.title}`,
        description: `<b>المهمة:</b> ${task.title}<br><b>الوصف:</b> ${task.description || 'لا يوجد'}<br><b>القضية المرتبطة:</b> ${task.relatedCaseId || 'لا يوجد'}`,
        start: {
            date: this.datePipe.transform(dueDate, 'yyyy-MM-dd')!,
        },
        end: {
            date: this.datePipe.transform(endDate, 'yyyy-MM-dd')!,
        },
        extendedProperties: {
            private: { appTaskId: `task-${task.id}` }
        }
    };
    
    try {
        await this.googleCalendarService.createOrUpdateEvent(eventDetails);
        this.notificationService.addNotification({
            type: 'success',
            title: 'تمت المزامنة مع التقويم',
            message: `تمت مزامنة المهمة "${task.title}" مع تقويم جوجل.`
        });
    } catch (error) {
        this.notificationService.addNotification({
            type: 'alert',
            title: 'فشل مزامنة التقويم',
            message: `لم نتمكن من مزامنة المهمة "${task.title}" مع تقويم جوجل.`
        });
        console.error('Error syncing task to Google Calendar:', error);
    }
  }
}