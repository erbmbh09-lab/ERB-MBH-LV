import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';

// --- INTERFACES ---

export interface Client {
  id: number;
  classification: 'موكل' | 'خصم';
  nameAr: string;
  nameEn: string;
  nationality?: string;
  emiratesId?: string;
  passportNo?: string;
  phone1: string;
  phone2?: string;
  email?: string;
  address?: string;
  username: string;
  loginEnabled: boolean;
}

export interface ProspectiveClient {
  id: number;
  name: string;
  phone: string;
  email?: string;
  // FIX: Added 'زيارة مباشرة' to the 'source' type to allow for this valid lead source in the mock data.
  source: 'إحالة' | 'موقع الكتروني' | 'اتصال مباشر' | 'زيارة مباشرة' | 'أخرى';
  status: 'جديد' | 'تم التواصل' | 'مؤهل' | 'غير مؤهل' | 'تحول لموكل';
  assignedTo: number;
  notes?: string;
  entryDate: string;
  followUpDate?: string;
}

const MOCK_CLIENTS: Client[] = [
    { id: 7607, classification: 'موكل', nameAr: 'محمد سالم العامري', nameEn: 'Mohammed Salem Alameri', phone1: '0501234567', username: '7607', loginEnabled: true },
    { id: 7606, classification: 'موكل', nameAr: 'شركة ميدسيرف للتجارة العامة', nameEn: 'Medserve General Trading LLC', phone1: '048876543', username: '7606', loginEnabled: true },
    { id: 7605, classification: 'موكل', nameAr: 'شركة العقارات المتحدة', nameEn: 'United Real Estate', phone1: '045551234', username: '7605', loginEnabled: false },
    { id: 9001, classification: 'خصم', nameAr: 'شركة الشحن السريع', nameEn: 'Speedy Shipping Co.', phone1: '043219876', username: '9001', loginEnabled: false },
    { id: 9002, classification: 'خصم', nameAr: 'أحمد عبدالله', nameEn: 'Ahmed Abdullah', phone1: '0567890123', username: '9002', loginEnabled: false },
    { id: 9003, classification: 'خصم', nameAr: 'سارة إبراهيم', nameEn: 'Sara Ibrahim', phone1: '0523456789', username: '9003', loginEnabled: false },
];

const MOCK_PROSPECTIVE_CLIENTS: ProspectiveClient[] = [
    { id: 1, name: 'علياء الكتبي', phone: '0501122334', email: 'alia@email.com', source: 'إحالة', status: 'جديد', assignedTo: 103, entryDate: '2024-05-20', followUpDate: '2024-05-27' },
    { id: 2, name: 'شركة الإنشاءات الحديثة', phone: '045556677', email: 'contact@modern.ae', source: 'موقع الكتروني', status: 'تم التواصل', assignedTo: 101, entryDate: '2024-05-18' },
    { id: 3, name: 'John Smith', phone: '0558889900', source: 'زيارة مباشرة', status: 'تحول لموكل', assignedTo: 102, entryDate: '2024-04-10' },
];

@Injectable({ providedIn: 'root' })
export class ClientService {
  private http = inject(HttpClient);
  clients = signal<Client[]>([]);
  prospectiveClients = signal<ProspectiveClient[]>([]);

  constructor() {
    this.clients.set(MOCK_CLIENTS);
    this.prospectiveClients.set(MOCK_PROSPECTIVE_CLIENTS);
  }

  addClient(client: Client): Promise<Client> {
    return firstValueFrom(this.http.post<Client>('/api/clients', client).pipe(
      tap(newClient => {
        this.clients.update(clients => [...clients, newClient]);
      })
    ));
  }

  updateClient(updatedClient: Client): Promise<Client> {
    return firstValueFrom(this.http.put<Client>(`/api/clients/${updatedClient.id}`, updatedClient).pipe(
      tap(returnedClient => {
        this.clients.update(clients => clients.map(c => c.id === returnedClient.id ? returnedClient : c));
      })
    ));
  }

  addProspectiveClient(lead: Omit<ProspectiveClient, 'id'>): Promise<ProspectiveClient> {
    return firstValueFrom(this.http.post<ProspectiveClient>('/api/prospective-clients', lead).pipe(
      tap(newLead => {
        this.prospectiveClients.update(l => [...l, {...newLead, id: Math.floor(Math.random() * 10000)}] );
      })
    ));
  }

  updateProspectiveClient(updatedLead: ProspectiveClient): Promise<ProspectiveClient> {
    return firstValueFrom(this.http.put<ProspectiveClient>(`/api/prospective-clients/${updatedLead.id}`, updatedLead).pipe(
      tap(returnedLead => {
        this.prospectiveClients.update(l => l.map(lead => lead.id === returnedLead.id ? returnedLead : lead));
      })
    ));
  }

  deleteProspectiveClient(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/prospective-clients/${id}`).pipe(
      tap(() => {
        this.prospectiveClients.update(l => l.filter(lead => lead.id !== id));
      })
    ));
  }
}