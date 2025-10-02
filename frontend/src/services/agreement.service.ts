import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';

// --- INTERFACES ---

export interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quote {
  id: string; // Q-YYYY-NNNN
  agreementId: number;
  date: string;
  status: 'مسودة' | 'مرسل' | 'مقبول' | 'مرفوض';
  items: QuoteItem[];
  totalAmount: number;
}

export interface AgreementEmail {
  id: number;
  agreementId: number;
  direction: 'مرسلة' | 'مستلمة';
  subject: string;
  body: string;
  date: string;
}

export interface Agreement {
  id: number;
  clientId: number;
  type: 'عادية' | 'سنوية';
  status: 'مسودة' | 'مرسلة' | 'مقبولة' | 'منتهية';
  startDate: string;
  endDate?: string;
  details: string;
  amount: number;
}

const MOCK_AGREEMENTS: Agreement[] = [
    { id: 1, clientId: 7607, type: 'عادية', status: 'مقبولة', startDate: '2023-01-15', details: 'اتفاقية أتعاب قضية تجارية رقم DXB-C-2024-112', amount: 25000 },
    { id: 2, clientId: 7606, type: 'سنوية', status: 'مرسلة', startDate: '2024-02-01', endDate: '2025-01-31', details: 'عقد استشارات قانونية سنوي', amount: 60000 },
];

const MOCK_QUOTES: Quote[] = [
    { id: 'Q-2024-0001', agreementId: 2, date: '2024-01-20', status: 'مرسل', items: [{ description: ' retainer fee', quantity: 12, unitPrice: 5000, total: 60000 }], totalAmount: 60000 }
];

const MOCK_EMAILS: AgreementEmail[] = [
    { id: 1, agreementId: 2, direction: 'مرسلة', subject: 'بخصوص عرض سعر الاستشارة السنوية', body: 'مرحباً، تجدون طيه عرض السعر الخاص بخدماتنا الاستشارية السنوية.', date: '2024-01-20T10:00:00Z' }
];


@Injectable({
  providedIn: 'root'
})
export class AgreementService {
  private http = inject(HttpClient);

  agreements = signal<Agreement[]>([]);
  quotes = signal<Quote[]>([]);
  agreementEmails = signal<AgreementEmail[]>([]);

  constructor() { 
    this.agreements.set(MOCK_AGREEMENTS);
    this.quotes.set(MOCK_QUOTES);
    this.agreementEmails.set(MOCK_EMAILS);
  }

  addAgreement(agreement: Omit<Agreement, 'id'>): Promise<Agreement> {
    return firstValueFrom(this.http.post<Agreement>('/api/agreements', agreement).pipe(
      tap(newAgreement => {
        this.agreements.update(a => [...a, newAgreement]);
      })
    ));
  }

  updateAgreement(updatedAgreement: Agreement): Promise<Agreement> {
    return firstValueFrom(this.http.put<Agreement>(`/api/agreements/${updatedAgreement.id}`, updatedAgreement).pipe(
      tap(returnedAgreement => {
        this.agreements.update(a => a.map(agr => agr.id === returnedAgreement.id ? returnedAgreement : agr));
      })
    ));
  }
  
  addQuote(quote: Omit<Quote, 'id'>): Promise<Quote> {
    return firstValueFrom(this.http.post<Quote>('/api/quotes', quote).pipe(
      tap(newQuote => {
        this.quotes.update(q => [...q, newQuote]);
      })
    ));
  }
  
  addAgreementEmail(email: Omit<AgreementEmail, 'id'>): Promise<AgreementEmail> {
    return firstValueFrom(this.http.post<AgreementEmail>('/api/agreement-emails', email).pipe(
      tap(newEmail => {
        this.agreementEmails.update(e => [...e, newEmail]);
      })
    ));
  }
}
