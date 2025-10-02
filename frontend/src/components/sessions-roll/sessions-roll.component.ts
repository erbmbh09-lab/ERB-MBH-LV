import { Component, ChangeDetectionStrategy, inject, signal, computed, Renderer2 } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataHubService } from '../../services/data-hub.service';
import { Session, Case } from '../../services/case.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-sessions-roll',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sessions-roll.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class SessionsRollComponent {
  dataHubService = inject(DataHubService);
  notificationService = inject(NotificationService);
  datePipe: DatePipe = inject(DatePipe);
  renderer = inject(Renderer2);

  // Filter signals
  fromDate = signal<string>('');
  toDate = signal<string>('');
  selectedCourt = signal<string>('all');

  // Modal signals
  isDecisionModalVisible = signal(false);
  isNotesModalVisible = signal(false);
  isCaseFileModalVisible = signal(false);
  selectedSession = signal<Session | null>(null);
  selectedCaseForFile = signal<Case | null>(null);
  modalInputText = signal('');
  postponementDate = signal('');
  postponementReason = signal('');
  isReservedForJudgment = signal(false);
  isJudgmentPostponed = signal(false);

  courts = computed(() => {
    // FIX: Access sessions through the correctly typed `dataHubService.cases` property.
    const allCourts = this.dataHubService.cases.sessions().map(s => s.case.court);
    return [...new Set(allCourts)];
  });

  filteredSessions = computed(() => {
    const from = this.fromDate() ? new Date(this.fromDate()) : null;
    const to = this.toDate() ? new Date(this.toDate()) : null;
    const court = this.selectedCourt();

    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);

    // FIX: Access sessions through the correctly typed `dataHubService.cases` property.
    return this.dataHubService.cases.sessions().filter(session => {
      const sessionDate = new Date(session.sessionDate);
      const isDateMatch = (!from || sessionDate >= from) && (!to || sessionDate <= to);
      const isCourtMatch = (court === 'all' || session.case.court === court);
      return isDateMatch && isCourtMatch;
    }).sort((a, b) => a.sessionDate.getTime() - b.sessionDate.getTime());
  });

  linkedCasesForModal = computed(() => {
    const selectedCase = this.selectedCaseForFile();
    if (!selectedCase || !selectedCase.linkedCaseIds || selectedCase.linkedCaseIds.length === 0) {
        return [];
    }
    // FIX: Access cases through the correctly typed `dataHubService.cases` property.
    const allCases = this.dataHubService.cases.cases();
    return selectedCase.linkedCaseIds
        .map(id => allCases.find(c => c.id === id))
        .filter((c): c is Case => !!c);
  });

  setCurrentWeekFilter() {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDay = new Date(firstDay);
    lastDay.setDate(lastDay.getDate() + 6);

    this.fromDate.set(this.datePipe.transform(firstDay, 'yyyy-MM-dd') || '');
    this.toDate.set(this.datePipe.transform(lastDay, 'yyyy-MM-dd') || '');
  }
  
  clearFilters() {
    this.fromDate.set('');
    this.toDate.set('');
    this.selectedCourt.set('all');
  }

  // Common Modal handlers
  openDecisionModal(session: Session) {
    this.selectedSession.set(session);
    this.modalInputText.set(session.sessionDecision);
    this.postponementDate.set('');
    this.postponementReason.set('');
    this.isReservedForJudgment.set(session.reservedForJudgment ?? false);
    this.isJudgmentPostponed.set(session.judgmentPostponed ?? false);
    this.isDecisionModalVisible.set(true);
  }

  openNotesModal(session: Session) {
    this.selectedSession.set(session);
    this.modalInputText.set(session.notes);
    this.isNotesModalVisible.set(true);
  }

  closeModals() {
    this.isDecisionModalVisible.set(false);
    this.isNotesModalVisible.set(false);
    this.isCaseFileModalVisible.set(false);
    this.renderer.removeClass(document.body, 'print-modal-active');
    this.selectedSession.set(null);
    this.selectedCaseForFile.set(null);
    this.modalInputText.set('');
    this.postponementDate.set('');
    this.postponementReason.set('');
  }
  
  handleReservedChange(checked: boolean) {
    this.isReservedForJudgment.set(checked);
    if (!checked) {
      this.isJudgmentPostponed.set(false);
    }
  }

  saveModalChanges() {
    const sessionToUpdate = this.selectedSession();
    if (!sessionToUpdate) return;

    if (this.isDecisionModalVisible()) {
      sessionToUpdate.reservedForJudgment = this.isReservedForJudgment();
      sessionToUpdate.judgmentPostponed = this.isReservedForJudgment() && this.isJudgmentPostponed();

      const newDate = this.postponementDate();
      const reason = this.postponementReason();
      const decisionText = this.modalInputText().trim();

      if (newDate) { // Postponement logic
        const formattedNewDate = this.datePipe.transform(newDate, 'dd/MM/yyyy');
        
        sessionToUpdate.sessionDecision = decisionText ? decisionText : `تم التأجيل لجلسة ${formattedNewDate}.`;

        if (reason) {
          sessionToUpdate.notes = `سبب التأجيل: ${reason}`;
        }
        
        const newSession: Omit<Session, 'id'> = {
          caseId: sessionToUpdate.caseId,
          case: sessionToUpdate.case,
          client: sessionToUpdate.client,
          opponent: sessionToUpdate.opponent,
          previousDecision: sessionToUpdate.sessionDecision,
          sessionDecision: '',
          notes: `مؤجلة من جلسة ${this.datePipe.transform(sessionToUpdate.sessionDate, 'dd/MM/yyyy')}`,
          sessionDate: new Date(newDate)
        };

        // FIX: Access addSession and updateSession through the correctly typed `dataHubService.cases` property.
        this.dataHubService.cases.addSession(newSession);
        this.dataHubService.cases.updateSession(sessionToUpdate);

        this.notificationService.addNotification({
          type: 'info',
          title: 'تم تأجيل الجلسة',
          message: `تم إنشاء جلسة جديدة للقضية ${sessionToUpdate.caseId} بتاريخ ${formattedNewDate}.`
        });

      } else { // Normal decision update
        sessionToUpdate.sessionDecision = this.modalInputText();
        // FIX: Access updateSession through the correctly typed `dataHubService.cases` property.
        this.dataHubService.cases.updateSession(sessionToUpdate);
         this.notificationService.addNotification({ type: 'success', title: 'تم الحفظ', message: `تم حفظ قرار الجلسة للقضية ${sessionToUpdate.caseId}.` });
      }

    } else if (this.isNotesModalVisible()) {
      sessionToUpdate.notes = this.modalInputText();
      // FIX: Access updateSession through the correctly typed `dataHubService.cases` property.
      this.dataHubService.cases.updateSession(sessionToUpdate);
      this.notificationService.addNotification({ type: 'success', title: 'تم الحفظ', message: `تم حفظ الملاحظات للجلسة.` });
    }
    
    this.closeModals();
  }

  isPostponed(session: Session): boolean {
    const decisionContainsPostponed = session.sessionDecision?.includes('تأجيل');
    const notesContainPostponed = session.notes?.includes('مؤجلة من جلسة');
    return !!(decisionContainsPostponed || notesContainPostponed);
  }

  // Case File Modal Handlers
  openCaseFileModal(session: Session) {
    // FIX: Access cases through the correctly typed `dataHubService.cases` property.
    const caseToShow = this.dataHubService.cases.cases().find(c => c.id === session.caseId);
    if (caseToShow) {
      this.selectedCaseForFile.set(caseToShow);
      this.selectedSession.set(session);
      this.isCaseFileModalVisible.set(true);
      this.renderer.addClass(document.body, 'print-modal-active');
    } else {
      console.error(`Case with ID ${session.caseId} not found for session:`, session);
    }
  }

  printPage() {
    window.print();
  }
}
