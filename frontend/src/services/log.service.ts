import { Injectable, signal } from '@angular/core';

export interface SystemLog {
  id: number;
  timestamp: string;
  userId: number;
  eventType: 'USER_LOGIN' | 'CASE_UPDATE' | 'CLIENT_DELETE' | 'SETTINGS_CHANGE' | 'TASK_CREATE';
  description: string;
  ipAddress: string;
}

const MOCK_LOGS: SystemLog[] = [
  {
    id: 1,
    timestamp: '2024-05-23T14:45:12Z',
    userId: 101,
    eventType: 'CASE_UPDATE',
    description: "المستخدم 'أحمد محمود' قام بتحديث القضية DXB-C-2024-112.",
    ipAddress: '192.168.1.10'
  },
  {
    id: 2,
    timestamp: '2024-05-23T14:40:05Z',
    userId: 1,
    eventType: 'USER_LOGIN',
    description: "المستخدم 'محمد بني هاشم' قام بتسجيل الدخول بنجاح.",
    ipAddress: '88.201.54.123'
  },
  {
    id: 3,
    timestamp: '2024-05-23T11:20:30Z',
    userId: 103,
    eventType: 'CLIENT_DELETE',
    description: "المستخدم 'مريم المنصوري' قامت بحذف العميل 'شركة وهمية'.",
    ipAddress: '192.168.1.15'
  },
  {
    id: 4,
    timestamp: '2024-05-22T18:05:00Z',
    userId: 1,
    eventType: 'SETTINGS_CHANGE',
    description: "المستخدم 'محمد بني هاشم' قام بتغيير مظهر النظام.",
    ipAddress: '88.201.54.123'
  },
  {
    id: 5,
    timestamp: '2024-05-22T16:30:00Z',
    userId: 103,
    eventType: 'TASK_CREATE',
    description: "المستخدم 'مريم المنصوري' أنشأت مهمة جديدة 'تحضير مذكرة دفاع قضية 112'.",
    ipAddress: '192.168.1.15'
  }
];

@Injectable({
  providedIn: 'root'
})
export class LogService {
  logs = signal<SystemLog[]>(MOCK_LOGS);

  constructor() { }

  // In a real application, you would have methods to fetch logs from a server
  // e.g., fetchLogs(filters: any): Observable<SystemLog[]>
}
