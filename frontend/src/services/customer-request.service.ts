import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';

export interface CustomerRequest {
  id: number;
  clientId: number;
  requestDate: string;
  requestType: 'طلب مستند' | 'استفسار عن قضية' | 'طلب تقرير' | 'أخرى';
  details: string;
  status: 'جديد' | 'قيد المراجعة' | 'تم التنفيذ' | 'مغلق';
  assignedTo: number;
  caseId?: string;
  subject?: string; // Added subject from client portal
}

const MOCK_REQUESTS: CustomerRequest[] = [
    { id: 1, clientId: 7607, requestDate: '2024-05-20', requestType: 'طلب مستند', details: 'أرجو تزويدي بنسخة من آخر مذكرة مقدمة في قضية DXB-C-2024-112', status: 'قيد المراجعة', assignedTo: 104, caseId: 'DXB-C-2024-112' },
    { id: 2, clientId: 7606, requestDate: '2024-05-18', requestType: 'استفسار عن قضية', details: 'هل تم تحديد موعد الجلسة القادمة في قضية الاستئناف؟', status: 'تم التنفيذ', assignedTo: 102, caseId: 'SHJ-L-2023-056' },
];

@Injectable({
  providedIn: 'root'
})
export class CustomerRequestService {
  private http = inject(HttpClient);
  requests = signal<CustomerRequest[]>([]);

  constructor() { 
    this.requests.set(MOCK_REQUESTS);
  }

  addRequest(request: Omit<CustomerRequest, 'id'>): Promise<CustomerRequest> {
    return firstValueFrom(this.http.post<CustomerRequest>('/api/customer-requests', request).pipe(
      tap(newRequest => {
        this.requests.update(reqs => [{...newRequest, id: Math.floor(Math.random() * 10000)}, ...reqs]);
      })
    ));
  }
  
  updateRequest(updatedRequest: CustomerRequest): Promise<CustomerRequest> {
    return firstValueFrom(this.http.put<CustomerRequest>(`/api/customer-requests/${updatedRequest.id}`, updatedRequest).pipe(
      tap(returnedRequest => {
        this.requests.update(reqs => reqs.map(r => r.id === returnedRequest.id ? returnedRequest : r));
      })
    ));
  }
  
  deleteRequest(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/customer-requests/${id}`).pipe(
      tap(() => {
        this.requests.update(reqs => reqs.filter(r => r.id !== id));
      })
    ));
  }
}
