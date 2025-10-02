import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';

export interface LegalConsultation {
  id: number;
  clientId: number;
  consultationDate: string;
  consultantId: number;
  subject: string;
  details: string;
  status: 'جديدة' | 'مكتملة' | 'تحولت لقضية';
  fees: number;
  relatedCaseId?: string;
}

const MOCK_CONSULTATIONS: LegalConsultation[] = [
    { id: 1, clientId: 7607, consultationDate: '2024-05-10', consultantId: 103, subject: 'استشارة حول إنهاء عقد إيجار تجاري', details: 'استفسر العميل عن التبعات القانونية لإنهاء عقد إيجار محل تجاري قبل انتهاء مدته.', status: 'مكتملة', fees: 1500 },
    { id: 2, clientId: 7606, consultationDate: '2024-04-25', consultantId: 102, subject: 'مراجعة عقد عمل لموظف جديد', details: 'تمت مراجعة العقد المقترح وتقديم ملاحظات بخصوص بنود شرط المنافسة.', status: 'تحولت لقضية', fees: 2000, relatedCaseId: 'SHJ-L-2023-056' },
    { id: 3, clientId: 7605, consultationDate: '2024-05-21', consultantId: 101, subject: 'استفسار حول تسجيل علامة تجارية', details: 'طلب العميل معرفة الإجراءات والتكاليف اللازمة لتسجيل علامة تجارية جديدة.', status: 'جديدة', fees: 500 },
];

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private http = inject(HttpClient);
  consultations = signal<LegalConsultation[]>([]);

  constructor() {
    this.consultations.set(MOCK_CONSULTATIONS);
  }

  addConsultation(consultation: Omit<LegalConsultation, 'id'>): Promise<LegalConsultation> {
    return firstValueFrom(this.http.post<LegalConsultation>('/api/consultations', consultation).pipe(
      tap(newConsultation => {
        this.consultations.update(c => [...c, {...newConsultation, id: Math.floor(Math.random() * 10000)}] );
      })
    ));
  }

  updateConsultation(updatedConsultation: LegalConsultation): Promise<LegalConsultation> {
    return firstValueFrom(this.http.put<LegalConsultation>(`/api/consultations/${updatedConsultation.id}`, updatedConsultation).pipe(
      tap(returnedConsultation => {
        this.consultations.update(c => c.map(cons => cons.id === returnedConsultation.id ? returnedConsultation : cons));
      })
    ));
  }

  deleteConsultation(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/consultations/${id}`).pipe(
      tap(() => {
        this.consultations.update(c => c.filter(cons => cons.id !== id));
      })
    ));
  }
}
