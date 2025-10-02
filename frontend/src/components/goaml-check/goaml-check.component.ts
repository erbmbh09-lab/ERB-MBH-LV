import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataHubService } from '../../services/data-hub.service';

interface SearchResult {
  status: 'safe' | 'match' | 'error';
  nameChecked: string;
  timestamp: string;
  details?: {
    matchScore: number;
    sourceList: string;
    reason: string;
  }
}

// NEW: Interface for imported report items
export interface GoamlReportItem {
  id: number;
  transactionDate: string;
  referenceNumber: string;
  name: string;
  amount: number;
  currency: string;
  status: 'مطابق' | 'آمن' | 'قيد المراجعة';
  notes?: string;
}

@Component({
  selector: 'app-goaml-check',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goaml-check.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class GoamlCheckComponent {
  private dataHubService = inject(DataHubService);
  private datePipe = inject(DatePipe);

  // NEW: Tab management
  activeTab = signal<'manual' | 'report'>('manual');

  // Manual Check state
  nameToCheck = signal('');
  isLoading = signal(false);
  searchResult = signal<SearchResult | null>(null);
  searchHistory = signal<SearchResult[]>([]);
  
  // Imported Report state
  reportSearchTerm = signal('');
  reportStatusFilter = signal<'all' | 'مطابق' | 'آمن' | 'قيد المراجعة'>('all');
  importedReportData = signal<GoamlReportItem[]>([
    { id: 1, transactionDate: '2024-05-20T10:30:00Z', referenceNumber: 'TXN-001-AB', name: 'شركة البناء الدولية', amount: 50000, currency: 'AED', status: 'آمن' },
    { id: 2, transactionDate: '2024-05-21T11:00:00Z', referenceNumber: 'TXN-002-CD', name: 'كيان خطر للاستيراد والتصدير', amount: 150000, currency: 'USD', status: 'مطابق', notes: 'تطابق مع قائمة عقوبات OFAC' },
    { id: 3, transactionDate: '2024-05-22T14:15:00Z', referenceNumber: 'TXN-003-EF', name: 'مؤسسة السلام التجارية', amount: 25000, currency: 'AED', status: 'قيد المراجعة', notes: 'تشابه أسماء، يتطلب تدقيق يدوي' },
    { id: 4, transactionDate: '2024-05-23T09:00:00Z', referenceNumber: 'TXN-004-GH', name: 'سليمان الأحمد وأولاده', amount: 75000, currency: 'SAR', status: 'آمن' },
  ]);

  filteredReportData = computed(() => {
    const term = this.reportSearchTerm().toLowerCase();
    const status = this.reportStatusFilter();

    return this.importedReportData().filter(item => {
      const statusMatch = status === 'all' || item.status === status;
      const termMatch = term === '' || 
        item.name.toLowerCase().includes(term) ||
        item.referenceNumber.toLowerCase().includes(term);
      return statusMatch && termMatch;
    });
  });

  allClients = this.dataHubService.clients.clients;

  constructor() {}

  async performCheck() {
    const name = this.nameToCheck().trim();
    if (!name || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.searchResult.set(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    let result: SearchResult;
    // Simple logic to force a match for demonstration
    if (name.toLowerCase().includes('خطر') || name.toLowerCase().includes('danger')) {
      result = {
        status: 'match',
        nameChecked: name,
        timestamp: new Date().toISOString(),
        details: {
          matchScore: 92,
          sourceList: 'القائمة الموحدة للعقوبات الدولية',
          reason: 'تطابق في الاسم وتاريخ الميلاد الجزئي.'
        }
      };
    } else {
      result = {
        status: 'safe',
        nameChecked: name,
        timestamp: new Date().toISOString()
      };
    }
    
    this.searchResult.set(result);
    this.searchHistory.update(history => [result, ...history]);
    this.isLoading.set(false);
  }

  // NEW: Handle file import
  onFileImport(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      console.log('Importing file:', file.name);
      // In a real application, you would parse the file here (e.g., using a CSV parsing library)
      // For demonstration, we'll just add more mock data.
      this.importedReportData.update(currentData => [
        ...currentData,
        { id: currentData.length + 1, transactionDate: new Date().toISOString(), referenceNumber: 'NEW-001', name: 'بيانات من ملف مستورد', amount: 12345, currency: 'AED', status: 'قيد المراجعة' }
      ]);
    }
  }

  // NEW: Get status class for styling
  getStatusClass(status: GoamlReportItem['status']): string {
    switch (status) {
      case 'آمن': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'مطابق': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'قيد المراجعة': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    }
  }
}