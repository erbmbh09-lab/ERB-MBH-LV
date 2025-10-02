import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataHubService } from '../../services/data-hub.service';
import { Client } from '../../services/client.service';
import { Case } from '../../services/case.service';
import { NotificationService } from '../../services/notification.service';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { ClientFormComponent } from '../client-form/client-form.component';
import { AgreementsManagementComponent } from '../agreements-management/agreements-management.component';

@Component({
  selector: 'app-client-management',
  standalone: true,
  imports: [FormsModule, FileUploadComponent, ClientFormComponent, AgreementsManagementComponent],
  templateUrl: './client-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientManagementComponent {
  dataHubService = inject(DataHubService);
  notificationService = inject(NotificationService);

  activeTab = signal<'list' | 'agreements'>('list');
  isModalVisible = signal(false);
  editingClient = signal<Client | null>(null);
  searchTerm = signal('');
  classificationFilter = signal<'all' | 'موكل' | 'خصم'>('all');
  
  isCasesModalVisible = signal(false);
  selectedClientForCases = signal<Client | null>(null);

  // FIX: Access clients through the correctly typed `dataHubService.clients` property.
  allClients = this.dataHubService.clients.clients;
  
  filteredClients = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const classification = this.classificationFilter();
    
    return this.allClients().filter(client => {
      const isClassificationMatch = classification === 'all' || client.classification === classification;
      
      const isTermMatch = !term ||
        client.id.toString().includes(term) ||
        client.nameAr.toLowerCase().includes(term) ||
        client.nameEn.toLowerCase().includes(term) ||
        (client.phone1 && client.phone1.toLowerCase().includes(term));
        
      return isClassificationMatch && isTermMatch;
    });
  });
  
  clientStats = computed(() => {
    return this.allClients().reduce((acc, client) => {
      if (client.classification === 'موكل') {
        acc.clients++;
      } else if (client.classification === 'خصم') {
        acc.opponents++;
      }
      return acc;
    }, { clients: 0, opponents: 0 });
  });

  caseCountsPerClient = computed(() => {
    // FIX: Access cases through the correctly typed `dataHubService.cases` property.
    const allCases = this.dataHubService.cases.cases();
    const countsMap = new Map<number, { active: number, pending: number, finished: number }>();

    this.allClients().forEach(client => {
      const clientCases = allCases.filter(c => c.parties?.some(p => p.clientId === client.id));
      const counts = {
        active: clientCases.filter(c => c.status === 'مفتوحة' || c.status === 'قيد التنفيذ').length,
        pending: clientCases.filter(c => c.status === 'معلقة').length,
        finished: clientCases.filter(c => c.status === 'مغلقة').length,
      };
      countsMap.set(client.id, counts);
    });
    return countsMap;
  });

  casesForSelectedClient = computed(() => {
    const client = this.selectedClientForCases();
    if (!client) return [];
    // FIX: Access cases through the correctly typed `dataHubService.cases` property.
    return this.dataHubService.cases.cases().filter(c => 
        c.parties?.some(p => p.clientId === client.id)
    );
  });

  openModal() {
    this.editingClient.set(null);
    this.isModalVisible.set(true);
  }
  
  editClient(client: Client) {
    this.editingClient.set(client);
    this.isModalVisible.set(true);
  }
  
  closeModal() {
    this.isModalVisible.set(false);
    this.editingClient.set(null);
  }

  openCasesModal(client: Client) {
    this.selectedClientForCases.set(client);
    this.isCasesModalVisible.set(true);
  }
  
  closeCasesModal() {
    this.isCasesModalVisible.set(false);
    this.selectedClientForCases.set(null);
  }

  navigateToCase(caseId: string) {
    this.dataHubService.caseToOpen.set(caseId);
    this.closeCasesModal();
  }
  
  getCaseRoleForClient(caseItem: Case, clientId: number): string {
    const party = caseItem.parties?.find(p => p.clientId === clientId);
    if (!party) return 'غير محدد';
    return party.capacity === 'client' ? 'موكل' : 'خصم';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'مفتوحة': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'قيد التنفيذ': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'معلقة': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'مغلقة': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return '';
    }
  }

  async onClientFormSubmit(clientData: Client) {
    const isEditing = !!this.editingClient();
    
    try {
      if (isEditing) {
        await this.dataHubService.clients.updateClient(clientData);
        this.notificationService.addNotification({
          type: 'success',
          title: 'تم التحديث بنجاح',
          message: `تم تحديث بيانات "${clientData.nameAr}".`
        });
      } else {
        await this.dataHubService.clients.addClient(clientData);
        this.notificationService.addNotification({
          type: 'success',
          title: 'تمت الإضافة بنجاح',
          message: `تمت إضافة "${clientData.nameAr}" إلى القائمة.`
        });
      }
      this.closeModal();
    } catch(error) {
        console.error("Error saving client:", error);
        this.notificationService.addNotification({
            type: 'alert',
            title: 'فشل الحفظ',
            message: 'حدث خطأ أثناء الاتصال بالخادم. قد يكون الكود التعريفي مستخدمًا بالفعل.'
        });
    }
  }
}