import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';

export interface Comment { authorId: number; content: string; timestamp: string; }
export interface ApprovalStep { approverId: number; status: 'pending' | 'approved' | 'rejected'; approvedAt?: string; notes?: string; }
export interface Task { id: number; title: string; description: string; type: 'personal' | 'assigned'; status: 'new' | 'in-progress' | 'pending-approval' | 'completed' | 'rejected'; priority: 'low' | 'medium' | 'high'; assignerId: number; assigneeId: number; createdAt: string; dueDate: string; completedAt?: string; relatedCaseId?: string; comments?: Comment[]; approvalWorkflow?: ApprovalStep[]; }

const MOCK_TASKS: Task[] = [
    { id: 1, title: 'تحضير مذكرة الدفاع لقضية 112', description: 'يجب الانتهاء من مسودة مذكرة الدفاع وتقديمها للمراجعة قبل نهاية الأسبوع.', type: 'assigned', status: 'in-progress', priority: 'high', assignerId: 103, assigneeId: 101, createdAt: '2024-05-20T10:00:00Z', dueDate: '2024-05-28', relatedCaseId: 'DXB-C-2024-112', comments: [{authorId: 103, content: 'يرجى التركيز على النقطة القانونية المتعلقة بالبند 5 من العقد.', timestamp: '2024-05-21T11:00:00Z'}] },
    { id: 2, title: 'متابعة مع الخبير في قضية 056', description: 'التواصل مع الخبير المعين للحصول على تقريره المبدئي.', type: 'assigned', status: 'new', priority: 'medium', assignerId: 101, assigneeId: 105, createdAt: '2024-05-22T15:00:00Z', dueDate: '2024-06-01', relatedCaseId: 'SHJ-L-2023-056' },
    { id: 3, title: 'مراجعة عقد الإيجار لمكتب الشارقة', description: 'مراجعة بنود عقد الإيجار الجديد لمكتب الشارقة قبل التوقيع.', type: 'assigned', status: 'pending-approval', priority: 'high', assignerId: 1, assigneeId: 103, createdAt: '2024-05-19T09:00:00Z', dueDate: '2024-05-25', approvalWorkflow: [{ approverId: 1, status: 'pending'}] },
    { id: 4, title: 'تحديث بيانات العملاء في النظام', description: 'التأكد من أن جميع بيانات الاتصال للعملاء محدثة.', type: 'assigned', status: 'completed', priority: 'low', assignerId: 103, assigneeId: 104, createdAt: '2024-05-01T12:00:00Z', dueDate: '2024-05-15', completedAt: '2024-05-14T16:00:00Z' },
];

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  tasks = signal<Task[]>([]);

  constructor() {
    this.tasks.set(MOCK_TASKS);
  }

  addTask(task: Omit<Task, 'id'>): Promise<Task> {
    return firstValueFrom(this.http.post<Task>('/api/tasks', task).pipe(
      tap(newTask => {
        this.tasks.update(t => [...t, {...newTask, id: Math.floor(Math.random() * 10000)}] );
      })
    ));
  }

  updateTask(updatedTask: Task): Promise<Task> {
    return firstValueFrom(this.http.put<Task>(`/api/tasks/${updatedTask.id}`, updatedTask).pipe(
      tap(returnedTask => {
        this.tasks.update(t => t.map(task => task.id === returnedTask.id ? returnedTask : task));
      })
    ));
  }
}
