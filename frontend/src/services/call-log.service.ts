import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';

// --- INTERFACES ---

export interface CallLog {
  id: number;
  callType: 'واردة' | 'صادرة';
  callerName: string;
  callerNumber: string;
  callDate: string;
  callTime: string;
  duration: number; // in minutes
  subject: string;
  details?: string;
  employeeId: number;
  status: 'مكتملة' | 'تتطلب متابعة';
  relatedCaseId?: string;
}

const MOCK_CALL_LOGS: CallLog[] = [
    { id: 1, callType: 'واردة', callerName: 'محمد سالم العامري', callerNumber: '0501234567', callDate: '2024-05-22', callTime: '10:30', duration: 15, subject: 'استفسار عن قضية DXB-C-2024-112', employeeId: 104, status: 'مكتملة' },
    { id: 2, callType: 'صادرة', callerName: 'محكمة دبي الابتدائية', callerNumber: '043334444', callDate: '2024-05-23', callTime: '14:00', duration: 5, subject: 'متابعة تقديم مذكرة', employeeId: 101, status: 'مكتملة', relatedCaseId: 'DXB-C-2024-112' },
    { id: 3, callType: 'واردة', callerName: 'عميل محتمل', callerNumber: '0559876543', callDate: '2024-05-23', callTime: '16:45', duration: 20, subject: 'استشارة بخصوص قضية عمالية', employeeId: 103, status: 'تتطلب متابعة', details: 'تم تحديد موعد استشارة أولية يوم الأحد القادم.' }
];

@Injectable({
  providedIn: 'root'
})
export class CallLogService {
  private http = inject(HttpClient);
  callLogs = signal<CallLog[]>([]);

  constructor() { 
    this.callLogs.set(MOCK_CALL_LOGS);
  }

  addCallLog(log: Omit<CallLog, 'id'>): Promise<CallLog> {
    return firstValueFrom(this.http.post<CallLog>('/api/call-logs', log).pipe(
      tap(newLog => {
        this.callLogs.update(l => [{...newLog, id: Math.floor(Math.random() * 10000)}, ...l]);
      })
    ));
  }
  
  updateCallLog(updatedLog: CallLog): Promise<CallLog> {
    return firstValueFrom(this.http.put<CallLog>(`/api/call-logs/${updatedLog.id}`, updatedLog).pipe(
      tap(returnedLog => {
        this.callLogs.update(l => l.map(log => log.id === returnedLog.id ? returnedLog : log));
      })
    ));
  }
  
  deleteCallLog(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/call-logs/${id}`).pipe(
      tap(() => {
        this.callLogs.update(l => l.filter(log => log.id !== id));
      })
    ));
  }
}
