import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, tap } from 'rxjs';

// --- INTERFACES ---

export interface Party {
  clientId: number;
  capacity: 'client' | 'opponent';
}

export interface LitigationStage {
  degree: string;
  caseNumber: string;
  year: string;
  clientCapacity: string;
  opponentCapacity: string;
  referralDate: string;
}

export interface JudicialAnnouncement {
  title: string;
  issueDate: string;
  legalPeriod: string;
}

export interface PetitionOrder {
  submissionDate: string;
  orderType: string;
  judgeDecision: 'accepted' | 'rejected' | 'pending';
  legalPeriod: string;
}

export interface Execution {
  date: string;
  type: string;
  status: 'قيد التنفيذ' | 'منفذ' | 'متوقف';
  amount: string;
}

export interface Memo {
    id: number;
    title: string;
    content: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'submitted';
    deadline: string;
    managerNotes: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  sharedWithClient: boolean;
  url?: string;
}

export interface Case {
  id: string; // e.g., 'SHJ-L-2023-056'
  internalCaseNumber: string; // e.g., 'ابتدائي-2025/5207'
  classification: string;
  caseType: string;
  branch: string;
  fees: number;
  subject: string;
  startDate: string;
  notes?: string;
  parties?: Party[];
  clientName: string;
  opponentName: string;
  memos?: Memo[];
  courtsPolice?: { policeStation: string; prosecution: string; court: string; };
  fileTeam?: { lawyerId?: number; legalConsultantId?: number; legalResearcherId?: number; secretaryId?: number; };
  litigationStages?: LitigationStage[];
  judicialAnnouncements?: JudicialAnnouncement[];
  petitionOrders?: PetitionOrder[];
  executions?: Execution[];
  documents?: Document[];
  assignedLawyer: string;
  court: string;
  lastUpdate: string;
  litigationStage: string;
  status: 'مفتوحة' | 'قيد التنفيذ' | 'معلقة' | 'مغلقة';
  linkedCaseIds?: string[];
  isImportant?: boolean;
  isConfidential?: boolean;
  counterClaimId?: string;
}

export interface Session {
  id: number;
  caseId: string;
  case: {
    number: string;
    year: string;
    type: string;
    court: string;
    date: string;
  };
  client: { name: string; capacity: string; };
  opponent: { name: string; capacity: string; };
  previousDecision: string;
  sessionDecision: string;
  notes: string;
  sessionDate: Date;
  reservedForJudgment?: boolean;
  judgmentPostponed?: boolean;
}

export interface LegalDeadline {
  caseId: string;
  caseNumber: string;
  client: string;
  judgmentDate: string; // The date the judgment/decision was issued.
  deadlineInDays: number;
  actionRequired: 'تسجيل الدعوى رسمياً' | 'تقديم تظلم' | 'تقديم استئناف' | 'تقديم طعن';
  stage: 'عريضة مقبولة' | 'عريضة مرفوضة' | 'حكم ابتدائي' | 'حكم استئناف';
  // Fields calculated by the frontend
  deadlineDate: string;
  daysRemaining: number;
  isOverdue: boolean;
}

const MOCK_CASES: Case[] = [
    { id: 'DXB-C-2024-112', internalCaseNumber: 'ابتدائي-2024/5207', classification: 'قيد', caseType: 'تجاري', branch: 'دبي', fees: 25000, subject: 'نزاع تجاري بخصوص شحنة بضائع تالفة', startDate: '2024-01-15', clientName: 'محمد سالم العامري', opponentName: 'شركة الشحن السريع', assignedLawyer: 'أحمد محمود', court: 'محكمة دبي الابتدائية', lastUpdate: '2024-05-20', litigationStage: 'ابتدائي', status: 'قيد التنفيذ', parties: [{clientId: 7607, capacity: 'client'}, {clientId: 9001, capacity: 'opponent'}], isImportant: true },
    { id: 'SHJ-L-2023-056', internalCaseNumber: 'استئناف-2023/105', classification: 'قيد', caseType: 'عمالي', branch: 'الشارقة', fees: 15000, subject: 'مطالبة بمستحقات نهاية الخدمة', startDate: '2023-08-02', clientName: 'شركة ميدسيرف للتجارة', opponentName: 'أحمد عبدالله', assignedLawyer: 'خالد العامري', court: 'محكمة الشارقة الاستئنافية', lastUpdate: '2024-05-18', litigationStage: 'استئناف', status: 'مفتوحة', parties: [{clientId: 7606, capacity: 'client'}, {clientId: 9002, capacity: 'opponent'}] },
    { id: 'DXB-R-2022-890', internalCaseNumber: 'ابتدائي-2022/9812', classification: 'قيد', caseType: 'عقاري', branch: 'دبي', fees: 50000, subject: 'إخلاء مستأجر لعدم سداد الإيجار', startDate: '2022-11-20', clientName: 'شركة العقارات المتحدة', opponentName: 'سارة إبراهيم', assignedLawyer: 'أحمد محمود', court: 'مركز فض المنازعات الإيجارية', lastUpdate: '2023-06-10', litigationStage: 'ابتدائي', status: 'مغلقة', parties: [{clientId: 7605, capacity: 'client'}, {clientId: 9003, capacity: 'opponent'}], linkedCaseIds: ['DXB-C-2024-112'] },
];

const MOCK_SESSIONS: any[] = [
    { id: 101, caseId: 'DXB-C-2024-112', case: { number: '5207', year: '2024', type: 'تجاري', court: 'محكمة دبي الابتدائية', date: '2024-01-15' }, client: { name: 'محمد سالم العامري', capacity: 'مدعي' }, opponent: { name: 'شركة الشحن السريع', capacity: 'مدعى عليه' }, previousDecision: 'تم قيد الدعوى', sessionDecision: 'تأجيل لتقديم المذكرات', notes: '', sessionDate: '2024-03-10T11:00:00Z' },
    { id: 102, caseId: 'DXB-C-2024-112', case: { number: '5207', year: '2024', type: 'تجاري', court: 'محكمة دبي الابتدائية', date: '2024-01-15' }, client: { name: 'محمد سالم العامري', capacity: 'مدعي' }, opponent: { name: 'شركة الشحن السريع', capacity: 'مدعى عليه' }, previousDecision: 'تأجيل لتقديم المذكرات', sessionDecision: 'حجزت للحكم', notes: 'سيصدر الحكم في الجلسة القادمة', sessionDate: '2024-05-28T09:30:00Z', reservedForJudgment: true },
    { id: 201, caseId: 'SHJ-L-2023-056', case: { number: '105', year: '2023', type: 'عمالي', court: 'محكمة الشارقة الاستئنافية', date: '2023-08-02' }, client: { name: 'شركة ميدسيرف للتجارة', capacity: 'مستأنف ضدها' }, opponent: { name: 'أحمد عبدالله', capacity: 'مستأنف' }, previousDecision: 'إحالة من أول درجة', sessionDecision: '', notes: 'جلسة أولى لتبادل المذكرات', sessionDate: '2024-06-05T10:00:00Z' },
];

const MOCK_LEGAL_DEADLINES: any[] = [
    { caseId: 'DXB-C-2024-112', caseNumber: 'ابتدائي-2024/5207', client: 'محمد سالم العامري', judgmentDate: '2024-04-30', deadlineInDays: 30, actionRequired: 'تقديم استئناف', stage: 'حكم ابتدائي' },
    { caseId: 'AUH-P-2024-001', caseNumber: 'عريضة-2024/123', client: 'شركة أبوظبي للإنشاءات', judgmentDate: '2024-05-15', deadlineInDays: 7, actionRequired: 'تقديم تظلم', stage: 'عريضة مرفوضة' }
];

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  private http = inject(HttpClient);

  cases = signal<Case[]>([]);
  sessions = signal<Session[]>([]);
  legalDeadlines = signal<LegalDeadline[]>([]);

  constructor() {
    this.cases.set(MOCK_CASES);
    this.sessions.set(MOCK_SESSIONS.map(s => ({...s, sessionDate: new Date(s.sessionDate)})));
    this.legalDeadlines.set(MOCK_LEGAL_DEADLINES.map(d => {
        const judgmentDate = new Date(d.judgmentDate);
        const deadlineDate = new Date(judgmentDate);
        deadlineDate.setDate(deadlineDate.getDate() + d.deadlineInDays);
        const daysRemaining = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return {
            ...d,
            deadlineDate: deadlineDate.toISOString().split('T')[0],
            daysRemaining: daysRemaining,
            isOverdue: daysRemaining < 0
        };
    }));
  }

  addCase(caseData: Case): Promise<Case> {
    return firstValueFrom(this.http.post<Case>('/api/cases', caseData).pipe(
      tap(newCase => {
        this.cases.update(cases => [newCase, ...cases]);
      })
    ));
  }

  updateCase(updatedCase: Case): Promise<Case> {
    return firstValueFrom(this.http.put<Case>(`/api/cases/${updatedCase.id}`, updatedCase).pipe(
      tap(returnedCase => {
        this.cases.update(cases => cases.map(c => c.id === returnedCase.id ? returnedCase : c));
      })
    ));
  }

  linkCases(mainCaseId: string, linkedCaseIds: string[]): Promise<void> {
    return firstValueFrom(this.http.post<void>('/api/cases/link', { mainCaseId, linkedCaseIds }).pipe(
      tap(() => {
        this.cases.update(cases => {
          const allIds = [mainCaseId, ...linkedCaseIds];
          return cases.map(c => {
            if (allIds.includes(c.id)) {
              return { ...c, linkedCaseIds: allIds.filter(id => id !== c.id) };
            }
            return c;
          });
        });
      })
    ));
  }

  addSession(sessionData: Omit<Session, 'id'>): Promise<Session> {
    return firstValueFrom(this.http.post<Session>('/api/sessions', sessionData).pipe(
      tap(newSession => {
        this.sessions.update(sessions => [...sessions, {...newSession, sessionDate: new Date(newSession.sessionDate)}]);
      })
    ));
  }

  updateSession(updatedSession: Session): Promise<Session> {
    return firstValueFrom(this.http.put<Session>(`/api/sessions/${updatedSession.id}`, updatedSession).pipe(
      tap(returnedSession => {
        this.sessions.update(sessions => sessions.map(s => s.id === returnedSession.id ? {...returnedSession, sessionDate: new Date(returnedSession.sessionDate)} : s));
      })
    ));
  }
}
